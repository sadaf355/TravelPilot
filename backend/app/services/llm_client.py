import json, os, urllib.request

def chat(system_prompt: str, user_prompt: str):
    """Optional OpenAI-compatible provider. If not configured, return None so demo mode stays offline-safe."""
    key=os.getenv('LLM_API_KEY')
    base=os.getenv('LLM_BASE_URL','').rstrip('/')
    model=os.getenv('LLM_MODEL','')
    if not key or not base or not model:
        return None
    body=json.dumps({'model':model,'messages':[{'role':'system','content':system_prompt},{'role':'user','content':user_prompt}],'temperature':0.2}).encode()
    req=urllib.request.Request(base+'/chat/completions',data=body,headers={'Content-Type':'application/json','Authorization':f'Bearer {key}'},method='POST')
    try:
        with urllib.request.urlopen(req,timeout=8) as r:
            data=json.loads(r.read().decode())
        return data['choices'][0]['message']['content']
    except Exception:
        return None
