"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";
import { ref, onValue, push, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { Users, LogOut, Activity, Navigation, Plus, ChevronRight } from "lucide-react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;}body{margin:0;}
.f{font-family:'Inter',sans-serif;}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
.au{animation:fadeUp .3s ease both;}.au1{animation:fadeUp .3s ease .05s both;}.au2{animation:fadeUp .3s ease .1s both;}
.dot{animation:pulse 2s ease infinite;}
.card{background:#111;border:1px solid #1f1f1f;border-radius:10px;transition:border-color .15s;}
.card:hover{border-color:#2a2a2a;}
.nav-item{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;cursor:pointer;border:none;background:none;width:100%;text-align:left;color:#555;font-size:13px;font-family:'Inter',sans-serif;transition:all .15s;}
.nav-item:hover{background:#161616;color:#999;}.nav-item.active{background:#1a1a1a;color:#fff;}
.badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;}
.row{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #141414;transition:background .15s;}
.row:hover{background:#0d0d0d;}.row:last-child{border-bottom:none;}
.inp{width:100%;background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:9px 12px;color:#e5e5e5;font-size:13px;font-family:'Inter',sans-serif;outline:none;margin-bottom:10px;transition:border-color .15s;}
.inp:focus{border-color:#333;}
.intern-opt{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;border:1px solid #1f1f1f;margin-bottom:6px;cursor:pointer;transition:all .15s;}
.intern-opt:hover{border-color:#2a2a2a;background:#111;}
.intern-opt.sel{border-color:#7c3aed;background:rgba(124,58,237,.06);}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:#1f1f1f;border-radius:2px;}
select{font-family:'Inter',sans-serif;outline:none;}
`;

const NAV = [{id:"overview",icon:Activity,label:"Overview"},{id:"assign",icon:Plus,label:"Assign Visit"},{id:"visits",icon:Navigation,label:"Visits"},{id:"interns",icon:Users,label:"Interns"}];
const COURSES = ["AI & Machine Learning","Data Science","Full Stack Dev","Cloud Computing","Cybersecurity","UI/UX Design"];
const CP_LABELS:any = {zenith_office:"🏢 Zenith Office",a_block:"🏗️ A Block",d_block:"🏛️ D Block",dedicated_floor:"🔝 Dedicated Floor",reception:"🎪 Reception",library:"📚 Library",canteen:"🍽️ Canteen",hostel:"🏠 Hostel",off_campus:"🌍 Off Campus",cabin:"🪵 Cabin"};

const Av = ({name,size=28}:any) => {
  const i=name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase()||"?";
  return <div style={{width:size,height:size,borderRadius:"50%",background:"#1f1f1f",border:"1px solid #2a2a2a",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:size>30?12:10,fontWeight:600,color:"#888"}}>{i}</span></div>;
};

const Badge = ({children,color="purple"}:any) => {
  const c:any={purple:{bg:"rgba(124,58,237,.12)",color:"#9575cd"},green:{bg:"rgba(34,197,94,.1)",color:"#4ade80"},amber:{bg:"rgba(245,158,11,.1)",color:"#fbbf24"},gray:{bg:"#1a1a1a",color:"#555"}};
  return <span className="badge" style={{background:c[color]?.bg,color:c[color]?.color,fontFamily:"Inter,sans-serif"}}>{children}</span>;
};

export default function CounsellorDashboard() {
  const {profile,loading} = useAuth();
  const router = useRouter();
  const [tab,setTab] = useState("overview");
  const [interns,setInterns] = useState<any[]>([]);
  const [visits,setVisits] = useState<any[]>([]);
  const [form,setForm] = useState({studentName:"",phone:"",course:COURSES[0],internUid:""});
  const [submitting,setSubmitting] = useState(false);
  const [toast,setToast] = useState("");
  const [mob,setMob] = useState(false);

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  useEffect(()=>{ if(!loading&&!profile) router.push("/login"); if(!loading&&profile&&profile.role!=="counsellor"&&profile.role!=="admin") router.push("/"); },[profile,loading]);
  useEffect(()=>{
    const u1=onValue(ref(db,"users"),s=>{ if(s.exists()){ const all=Object.entries(s.val()).map(([uid,v]:any)=>({uid,...v})); setInterns(all.filter((u:any)=>u.role==="intern")); }});
    const u2=onValue(ref(db,"visits"),s=>{ if(s.exists()) setVisits(Object.entries(s.val()).map(([id,v]:any)=>({id,...v}))); else setVisits([]); });
    return ()=>{ u1(); u2(); };
  },[]);

  const assignVisit = async () => {
    if(!form.studentName||!form.internUid){ showToast("Please fill all fields and select an intern"); return; }
    setSubmitting(true);
    const intern=interns.find(i=>i.uid===form.internUid);
    const vRef=push(ref(db,"visits"));
    await set(vRef,{studentName:form.studentName,phone:form.phone,course:form.course,internUid:form.internUid,internName:intern?.name||"",counsellorUid:profile?.uid,counsellorName:profile?.name,status:"assigned",checkpoints:[],createdAt:Date.now()});
    await set(push(ref(db,`notifications/${form.internUid}`)),{title:"New Visit",message:`${form.studentName} assigned to you.`,read:false,createdAt:Date.now()});
    showToast(`Visit assigned to ${intern?.name}`);
    setForm({studentName:"",phone:"",course:COURSES[0],internUid:""});
    setSubmitting(false);
    setTab("visits");
  };

  const onDuty=interns.filter(i=>i.isOnDuty);

  if(loading) return <div style={{background:"#0a0a0a",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:"#333",fontFamily:"Inter,sans-serif",fontSize:13}}>Loading...</p></div>;

  return (
    <>
      <style>{CSS}</style>
      {toast && <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:8,padding:"10px 16px",color:"#fff",fontSize:12,zIndex:100,fontFamily:"Inter,sans-serif"}}>{toast}</div>}
      <div className="f" style={{display:"flex",minHeight:"100vh",background:"#0a0a0a"}}>

        {mob && <div onClick={()=>setMob(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:40}}/>}
        <aside style={{width:200,flexShrink:0,display:"flex",flexDirection:"column",padding:"16px 10px",borderRight:"1px solid #141414",position:"fixed",top:0,left:0,height:"100vh",background:"#0a0a0a",zIndex:50,transition:"transform .25s",transform:mob?"translateX(0)":"translateX(-200px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",marginBottom:20}}>
            <div style={{width:22,height:22,borderRadius:6,background:"#7c3aed",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span style={{fontSize:13,fontWeight:600,color:"#fff"}}>CampusFlow</span>
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:1}}>
            {NAV.map(n=>(
              <button key={n.id} className={`nav-item${tab===n.id?" active":""}`} onClick={()=>{setTab(n.id);setMob(false);}}>
                <n.icon size={14}/>{n.label}
              </button>
            ))}
          </div>
          <div style={{borderTop:"1px solid #141414",paddingTop:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",marginBottom:6}}>
              <Av name={profile?.name}/>
              <div style={{overflow:"hidden"}}>
                <p style={{fontSize:12,fontWeight:500,color:"#fff",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{profile?.name}</p>
                <p style={{fontSize:10,color:"#444",margin:0}}>Counsellor</p>
              </div>
            </div>
            <button className="nav-item" onClick={async()=>{await logout();router.push("/login");}}>
              <LogOut size={14}/>Logout
            </button>
          </div>
        </aside>

        <div style={{flex:1,marginLeft:0,display:"flex",flexDirection:"column"}}>
          <header style={{padding:"12px 16px",borderBottom:"1px solid #141414",position:"sticky",top:0,background:"#0a0a0a",zIndex:30,display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setMob(!mob)} style={{background:"none",border:"none",cursor:"pointer",padding:4,color:"#555",display:"flex",alignItems:"center"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <p style={{fontSize:13,fontWeight:500,color:"#666",margin:0,flex:1}}>{NAV.find((n:any)=>n.id===tab)?.label}</p>
            <Badge color="gray">Counsellor</Badge>
          </header>

          <main style={{flex:1,padding:"24px",overflowY:"auto"}}>

            {tab==="overview" && (
              <div style={{display:"flex",flexDirection:"column",gap:20}}>
                <div className="au">
                  <p style={{fontSize:18,fontWeight:600,color:"#fff",margin:"0 0 2px"}}>Welcome, {profile?.name?.split(" ")[0]}</p>
                  <p style={{fontSize:13,color:"#444",margin:0}}>Manage campus visits</p>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[{l:"Total Visits",v:visits.length},{l:"Completed",v:visits.filter((v:any)=>v.status==="completed").length},{l:"On Duty",v:onDuty.length}].map((s,i)=>(
                    <div key={i} className="card au1" style={{padding:"16px 18px"}}>
                      <p style={{fontSize:22,fontWeight:700,color:"#fff",margin:"0 0 2px",letterSpacing:"-0.5px"}}>{s.v}</p>
                      <p style={{fontSize:12,color:"#444",margin:0}}>{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="au2 card" style={{overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:"1px solid #141414",display:"flex",alignItems:"center",gap:8}}>
                    <div className="dot" style={{width:6,height:6,borderRadius:"50%",background:"#22c55e"}}/>
                    <p style={{fontSize:13,fontWeight:500,color:"#fff",margin:0}}>On-Duty Interns</p>
                  </div>
                  {onDuty.length===0 ? <p style={{padding:"20px 16px",color:"#333",fontSize:13,margin:0}}>No interns on duty.</p>
                  : onDuty.map((u,i)=>(
                    <div key={i} className="row">
                      <Av name={u.name}/>
                      <p style={{fontSize:13,fontWeight:500,color:"#e5e5e5",margin:0}}>{u.name}</p>
                      <Badge color="green">On Duty</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="assign" && (
              <div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:480}}>
                <div className="au"><p style={{fontSize:18,fontWeight:600,color:"#fff",margin:0}}>Assign Visit</p></div>
                <div className="au1 card" style={{padding:20}}>
                  <input className="inp" placeholder="Student name" value={form.studentName} onChange={e=>setForm(f=>({...f,studentName:e.target.value}))}/>
                  <input className="inp" placeholder="Phone number" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
                  <select className="inp" value={form.course} onChange={e=>setForm(f=>({...f,course:e.target.value}))} style={{marginBottom:16,cursor:"pointer"}}>
                    {COURSES.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <p style={{fontSize:11,fontWeight:500,color:"#444",margin:"0 0 8px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Select Intern</p>
                  {onDuty.length===0 ? <p style={{fontSize:13,color:"#333",marginBottom:16}}>No interns on duty right now.</p>
                  : onDuty.map(u=>(
                    <div key={u.uid} className={`intern-opt${form.internUid===u.uid?" sel":""}`} onClick={()=>setForm(f=>({...f,internUid:u.uid}))}>
                      <Av name={u.name}/>
                      <p style={{fontSize:13,fontWeight:500,color:"#e5e5e5",margin:0,flex:1}}>{u.name}</p>
                      {form.internUid===u.uid && <span style={{fontSize:11,color:"#7c3aed"}}>Selected</span>}
                    </div>
                  ))}
                  <button onClick={assignVisit} disabled={submitting}
                    style={{width:"100%",background:"#fff",color:"#000",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:600,marginTop:8,opacity:submitting?.6:1,cursor:"pointer",border:"none",fontFamily:"Inter,sans-serif"}}>
                    {submitting?"Assigning...":"Assign Visit"}
                  </button>
                </div>
              </div>
            )}

            {tab==="visits" && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="au"><p style={{fontSize:18,fontWeight:600,color:"#fff",margin:0}}>Visits</p></div>
                <div className="au1 card" style={{overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:"1px solid #141414",display:"flex",alignItems:"center",gap:8}}>
                    <div className="dot" style={{width:6,height:6,borderRadius:"50%",background:"#22c55e"}}/>
                    <p style={{fontSize:13,fontWeight:500,color:"#fff",margin:0}}>Live Visits <span style={{color:"#444"}}>({visits.length})</span></p>
                  </div>
                  {visits.length===0 ? <p style={{padding:"20px 16px",color:"#333",fontSize:13,margin:0}}>No visits yet.</p>
                  : visits.map((v,i)=>(
                    <div key={i} className="row">
                      <div style={{flex:1}}>
                        <p style={{fontSize:13,fontWeight:500,color:"#e5e5e5",margin:0}}>{v.studentName}</p>
                        <p style={{fontSize:11,color:"#444",margin:0}}>{v.course} · {v.internName}</p>
                        {v.currentCheckpoint && v.status!=="completed" && (
                          <div style={{display:"flex",alignItems:"center",gap:4,marginTop:4}}>
                            <div style={{width:5,height:5,borderRadius:"50%",background:"#22c55e"}} className="dot"/>
                            <span style={{fontSize:11,color:"#22c55e"}}>Currently at: {CP_LABELS[v.currentCheckpoint]||v.currentCheckpoint}</span>
                          </div>
                        )}
                        {v.checkpoints?.length>0 && (
                          <p style={{fontSize:10,color:"#333",margin:"2px 0 0"}}>Visited: {v.checkpoints.map((c:string)=>CP_LABELS[c]||c).join(" → ")}</p>
                        )}
                      </div>
                      <Badge color={v.status==="completed"?"green":v.status==="in_progress"?"amber":"purple"}>{v.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="interns" && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="au"><p style={{fontSize:18,fontWeight:600,color:"#fff",margin:0}}>Interns</p></div>
                <div className="au1 card" style={{overflow:"hidden"}}>
                  {interns.map((u,i)=>(
                    <div key={i} className="row">
                      <div style={{width:6,height:6,borderRadius:"50%",background:u.isOnDuty?"#22c55e":"#222",flexShrink:0}}/>
                      <Av name={u.name}/>
                      <div style={{flex:1}}>
                        <p style={{fontSize:13,fontWeight:500,color:"#e5e5e5",margin:0}}>{u.name}</p>
                        <p style={{fontSize:11,color:"#444",margin:0}}>{u.email}</p>
                      </div>
                      <Badge color={u.isOnDuty?"green":"gray"}>{u.isOnDuty?"On Duty":"Off"}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  );
}
