"""Read a DOCX and export paragraph-level genuine Word revisions via stdin JSON."""
import sys, json, zipfile, copy, re, hashlib
from pathlib import Path
from datetime import datetime, timezone
from lxml import etree as ET

W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS={'w':W}
ET.register_namespace('w',W)
ET.set_default_parser(ET.XMLParser(resolve_entities=False,no_network=True))
def tag(name): return '{'+W+'}'+name
def load(file,allow_revisions=False):
    with zipfile.ZipFile(file) as archive:
        if sum(info.file_size for info in archive.infolist())>50*1024*1024:raise ValueError('Expanded DOCX exceeds 50 MB')
        if any('vbaproject' in name.lower() for name in archive.namelist()):raise ValueError('Macro-enabled documents are not supported')
        parts={name:archive.read(name) for name in archive.namelist()}
    xml=ET.fromstring(parts['word/document.xml'])
    if not allow_revisions and (xml.find('.//w:ins',NS) is not None or xml.find('.//w:del',NS) is not None):
        raise ValueError('Select a clean master DOCX without existing tracked revisions')
    return parts,xml
def paragraphs(xml):
    return [{'index':i,'text':''.join(t.text or '' for t in p.findall('.//w:t',NS))} for i,p in enumerate(xml.findall('.//w:p',NS))]
def run(text,props=None,deleted=False):
    r=ET.Element(tag('r'))
    if props is not None: r.append(copy.deepcopy(props))
    t=ET.SubElement(r,tag('delText' if deleted else 't'));t.set('{http://www.w3.org/XML/1998/namespace}space','preserve');t.text=text
    return r
def remove_highlights(tree):
    nodes=tree.findall('.//w:highlight',NS)
    for node in nodes:node.getparent().remove(node)
    return len(nodes)
def highlight_keywords(tree,keywords):
    terms=sorted(set(k.strip() for k in keywords if isinstance(k,str) and k.strip()),key=len,reverse=True)
    if not terms:return 0
    pattern=re.compile(r'(?<!\w)(?:'+'|'.join(re.escape(k) for k in terms)+r')(?!\w)',re.I)
    count=0
    for p in tree.findall('.//w:p',NS):
        groups={}
        for r in p.findall('.//w:r',NS):
            texts=[child for child in r if child.tag in [tag('t'),tag('delText')]]
            if len(texts)!=1 or any(child.tag not in [tag('rPr'),tag('t'),tag('delText')] for child in r):continue
            deletion=next((ancestor for ancestor in r.iterancestors() if ancestor.tag==tag('del')),None)
            key=id(deletion) if deletion is not None else 'visible'
            groups.setdefault(key,[]).append((r,texts[0]))
        for runs in groups.values():
            combined=''.join(node.text or '' for _,node in runs);matches=list(pattern.finditer(combined));count+=len(matches);offset=0
            for r,node in runs:
                text=node.text or '';length=len(text);intervals=[(max(0,m.start()-offset),min(length,m.end()-offset)) for m in matches if m.start()<offset+length and m.end()>offset];offset+=length
                if not intervals:continue
                cuts=sorted(set([0,length]+[x for interval in intervals for x in interval]));parent=r.getparent();position=parent.index(r)
                for a,b in zip(cuts,cuts[1:]):
                    if a==b:continue
                    clone=copy.deepcopy(r);clone.find(node.tag).text=text[a:b];clone.find(node.tag).set('{http://www.w3.org/XML/1998/namespace}space','preserve')
                    if any(start<=a and b<=end for start,end in intervals):
                        props=clone.find('w:rPr',NS)
                        if props is None:props=ET.Element(tag('rPr'));clone.insert(0,props)
                        ET.SubElement(props,tag('highlight'),{tag('val'):'yellow'})
                    parent.insert(position,clone);position+=1
                parent.remove(r)
    return count
def write_variant(parts,xml,changes,file,tracked,keywords=None):
    tree=copy.deepcopy(xml); ps=tree.findall('.//w:p',NS)
    existing_ids=[int(n.get(tag('id'))) for n in tree.iter() if (n.get(tag('id')) or '').isdigit()]
    revision=max(existing_ids,default=0)+1
    for change in changes:
        if not change.get('accepted',True): continue
        p=ps[change['index']];old=change['before'];new=change['after']
        if old==new:continue
        props=p.find('w:r/w:rPr',NS)
        for child in list(p):
            if child.tag!=tag('pPr'): p.remove(child)
        if tracked:
            for name,text,deleted in [('del',old,True),('ins',new,False)]:
                if not text:continue
                wrapper=ET.SubElement(p,tag(name),{tag('id'):str(revision),tag('author'):'Job Search Workspace',tag('date'):datetime.now(timezone.utc).isoformat().replace('+00:00','Z')});revision+=1;wrapper.append(run(text,props,deleted))
        elif new:p.append(run(new,props))
    remove_highlights(tree)
    highlights=highlight_keywords(tree,keywords or [])
    updated=dict(parts);updated['word/document.xml']=ET.tostring(tree,encoding='utf-8',xml_declaration=True)
    for name,data in parts.items():
        if re.match(r'word/(header|footer)\d+\.xml$',name):
            other=ET.fromstring(data);removed=remove_highlights(other);added=highlight_keywords(other,keywords or []);highlights+=added
            if removed or added:updated[name]=ET.tostring(other,encoding='utf-8',xml_declaration=True)
    settings=ET.fromstring(parts['word/settings.xml'])
    for element in list(settings):
        if element.tag==tag('trackRevisions'): settings.remove(element)
    if tracked:ET.SubElement(settings,tag('trackRevisions'))
    updated['word/settings.xml']=ET.tostring(settings,encoding='utf-8',xml_declaration=True)
    with zipfile.ZipFile(file,'w',zipfile.ZIP_DEFLATED) as archive:
        for name,data in updated.items():archive.writestr(name,data)
    with zipfile.ZipFile(file) as archive:
        check=ET.fromstring(archive.read('word/document.xml'))
        return {'insertions':len(check.findall('.//w:ins',NS)),'deletions':len(check.findall('.//w:del',NS)),'keyword_occurrences':highlights,'highlight_runs':len(check.findall('.//w:highlight',NS))}
def main(payload):
    if payload['operation']=='strip_highlights':
        parts,xml=load(Path(payload['master']),allow_revisions=True);removed=0
        for name,data in list(parts.items()):
            if name.startswith('word/') and name.endswith('.xml'):
                tree=ET.fromstring(data);count=remove_highlights(tree);removed+=count
                if count:parts[name]=ET.tostring(tree,encoding='utf-8',xml_declaration=True)
        output=Path(payload['output']);output.parent.mkdir(parents=True,exist_ok=True)
        with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as archive:
            for name,data in parts.items():archive.writestr(name,data)
        return {'removed_highlights':removed,'remaining_revisions':len(xml.findall('.//w:ins',NS))+len(xml.findall('.//w:del',NS))}
    file=Path(payload['master']);parts,xml=load(file);ps=paragraphs(xml)
    if payload['operation']=='read':return {'paragraphs':ps,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
    if hashlib.sha256(file.read_bytes()).hexdigest()!=payload['master_sha256']:raise ValueError('Master CV changed. Create a new draft.')
    changes=payload['changes'];seen=set()
    for c in changes:
        index=c['index']
        if not isinstance(index,int) or index<0 or index>=len(ps) or index in seen or ps[index]['text']!=c['before']:raise ValueError('Invalid or outdated paragraph change')
        if not isinstance(c['after'],str) or len(c['after'])>12000:raise ValueError('Invalid replacement text')
        seen.add(index)
    out=Path(payload['output']);out.mkdir(parents=True,exist_ok=True)
    review=write_variant(parts,xml,changes,out/'cv_tracked.docx',True)
    highlighted=write_variant(parts,xml,changes,out/'cv_tracked_highlighted.docx',True,payload.get('keywords',[]))
    final=write_variant(parts,xml,changes,out/'cv_final.docx',False)
    if final['insertions'] or final['deletions']:raise ValueError('Clean export still contains revisions')
    return {'tracked':review,'highlighted':highlighted,'final':final,'accepted_changes':sum(bool(c.get('accepted',True)) and c['before']!=c['after'] for c in changes)}
if __name__ == '__main__':
    # Node sends UTF-8 JSON; Windows may otherwise decode stdin as cp1252.
    sys.stdin.reconfigure(encoding='utf-8')
    sys.stdout.reconfigure(encoding='utf-8')
    try:
        result=main(json.load(sys.stdin));print(json.dumps(result,ensure_ascii=True))
    except Exception as error:
        print(json.dumps({'error':str(error)}));sys.exit(1)
