"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";
import { ref, onValue, push, set, serverTimestamp } from "firebase/database";
import { db } from "@/lib/firebase";
import {
  Users, Star, Bell, LogOut, Activity, Navigation,
  Plus, User, Zap, BarChart3, Clock, CheckCircle, ArrowUpRight
} from "lucide-react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
*,*::before,*::after{box-sizing:border-box;}body{margin:0;}
.f-syne{font-family:'Syne',sans-serif!important;}.f-dm{font-family:'DM Sans',sans-serif!important;}
@keyframes floatA{0%,100%{transform:translate(0,0) scale(1);}40%{transform:translate(40px,-40px) scale(1.06);}70%{transform:translate(-25px,25px) scale(0.94);}}
@keyframes floatB{0%,100%{transform:translate(0,0);}50%{transform:translate(-30px,-20px);}}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse2{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.5);opacity:.5;}}
@keyframes toastIn{from{opacity:0;transform:translateX(110px) scale(.95);}to{opacity:1;transform:translateX(0) scale(1);}}
.orb1{animation:floatA 14s ease-in-out infinite;}.orb2{animation:floatB 18s ease-in-out infinite reverse;}
.au{animation:fadeUp .55s cubic-bezier(.16,1,.3,1) both;}.au1{animation:fadeUp .55s cubic-bezier(.16,1,.3,1) .08s both;}.au2{animation:fadeUp .55s cubic-bezier(.16,1,.3,1) .16s both;}
.live-dot{animation:pulse2 1.6s ease-in-out infinite;}.toast-in{animation:toastIn .42s cubic-bezier(.16,1,.3,1) both;}
.glass{background:rgba(255,255,255,.04);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,.07);}
.glass-hi:hover{background:rgba(255,255,255,.06)!important;border-color:rgba(139,92,246,.22)!important;transition:all .22s;}
.glow-v{box-shadow:0 0 44px rgba(124,58,237,.38),0 0 90px rgba(124,58,237,.14);}
.cshadow{box-shadow:0 6px 36px rgba(0,0,0,.45),0 1px 0 rgba(255,255,255,.04) inset;}
.grad-text{background:linear-gradient(135deg,#c4b5fd 0%,#8b5cf6 50%,#6d28d9 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.btn-v{background:linear-gradient(135deg,#7c3aed,#6d28d9);transition:all .2s;border:none;cursor:pointer;color:white;}
.btn-v:hover{background:linear-gradient(135deg,#8b5cf6,#7c3aed);transform:translateY(-1px);box-shadow:0 10px 28px rgba(124,58,237,.42);}
.nav-it{transition:all .18s;cursor:pointer;border:none;background:none;width:100%;text-align:left;}
.nav-it:hover{background:rgba(139,92,246,.1);border-radius:.75rem;}.nav-it.on{background:rgba(124,58,237,.2);border-radius:.75rem;border-left:2px solid #8b5cf6;}
.sc-hover{transition:all .28s cubic-bezier(.16,1,.3,1);}.sc-hover:hover{transform:translateY(-4px);box-shadow:0 16px 44px rgba(124,58,237,.22);}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(139,92,246,.35);border-radius:2px;}
input,select,textarea{outline:none!important;font-family:'DM Sans',sans-serif;}
input:focus,select:focus{border-color:rgba(139,92,246,.55)!important;box-shadow:0 0 0 3px rgba(139,92,246,.1)!important;}
`;

const COURSES = ["AI & Machine Learning","Data Science","Full Stack Dev","Cloud Computing","Cybersecurity","UI/UX Design"];
const NAV = [{id:"overview",icon:Activity,label:"Overview"},{id:"assign",icon:Plus,label:"Assign Visit"},{id:"visits",icon:Navigation,label:"Live Visits"},{id:"interns",icon:Users,label:"Interns"}];

const Av = ({ name, sz="md" }: any) => {
  const init = name ? name.split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase() : "?";
  const s = sz==="sm"?28:36;
  return <div style={{width:s,height:s,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#4f46e5)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span className="f-syne" style={{fontSize:sz==="sm"?10:12,fontWeight:700,color:"white"}}>{init}</span></div>;
};

const Badge = ({ children, v="violet" }: any) => {
  const colors: any = {violet:{bg:"rgba(124,58,237,.18)",color:"#a78bfa"},green:{bg:"rgba(34,197,94,.15)",color:"#4ade80"},amber:{bg:"rgba(245,158,11,.15)",color:"#fbbf24"},red:{bg:"rgba(239,68,68,.15)",color:"#f87171"}};
  const c = colors[v]||colors.violet;
  return <span className="f-syne" style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:c.bg,color:c.color,letterSpacing:.4}}>{children}</span>;
};

const inp = {width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)",borderRadius:10,padding:"10px 14px",color:"#f8f8ff",fontSize:13,marginBottom:12} as any;

export default function CounsellorDashboard() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab]           = useState("overview");
  const [interns, setInterns]   = useState<any[]>([]);
  const [visits, setVisits]     = useState<any[]>([]);
  const [toasts, setToasts]     = useState<any[]>([]);
  const [form, setForm]         = useState({studentName:"",phone:"",course:COURSES[0],internUid:""});
  const [submitting, setSubmitting] = useState(false);

  const toast = useCallback((type: string, title: string, msg: string) => {
    const id = Date.now();
    setToasts(t=>[...t,{id,type,title,msg}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4000);
  },[]);

  useEffect(()=>{
    if(!loading && !profile) router.push("/login");
    if(!loading && profile && profile.role!=="counsellor" && profile.role!=="admin") router.push("/");
  },[profile,loading]);

  useEffect(()=>{
    const u1 = onValue(ref(db,"users"),(snap)=>{
      if(snap.exists()){
        const all = Object.entries(snap.val()).map(([uid,v]:any)=>({uid,...v}));
        setInterns(all.filter((u:any)=>u.role==="intern"));
      }
    });
    const u2 = onValue(ref(db,"visits"),(snap)=>{
      if(snap.exists()) setVisits(Object.entries(snap.val()).map(([id,v]:any)=>({id,...v})));
      else setVisits([]);
    });
    return ()=>{ u1(); u2(); };
  },[]);

  const assignVisit = async () => {
    if(!form.studentName||!form.internUid){ toast("error","Missing Info","Fill all fields and select an intern."); return; }
    setSubmitting(true);
    const intern = interns.find(i=>i.uid===form.internUid);
    const visitRef = push(ref(db,"visits"));
    await set(visitRef,{
      studentName: form.studentName,
      phone: form.phone,
      course: form.course,
      internUid: form.internUid,
      internName: intern?.name||"",
      counsellorUid: profile?.uid,
      counsellorName: profile?.name,
      status: "assigned",
      checkpoints: [],
      createdAt: Date.now(),
    });
    await set(push(ref(db,`notifications/${form.internUid}`)),{
      title:"New Visit Assigned",
      message:`${form.studentName} assigned to you.`,
      read:false,
      createdAt:Date.now(),
    });
    toast("success","Visit Assigned!",`${form.studentName} assigned to ${intern?.name}.`);
    setForm({studentName:"",phone:"",course:COURSES[0],internUid:""});
    setSubmitting(false);
    setTab("visits");
  };

  const handleLogout = async () => { await logout(); router.push("/login"); };
  const onDuty = interns.filter(i=>i.isOnDuty);

  if(loading) return <div style={{background:"#07070f",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:"#6b7280",fontFamily:"sans-serif"}}>Loading...</p></div>;

  return (
    <>
      <style>{CSS}</style>
      <div className="f-dm" style={{display:"flex",minHeight:"100vh",background:"#07070f"}}>
        <div style={{position:"fixed",top:20,right:20,zIndex:100,display:"flex",flexDirection:"column",gap:8}}>
          {toasts.map(t=>(
            <div key={t.id} className="toast-in glass cshadow" style={{borderRadius:14,padding:"12px 16px",minWidth:260,borderLeft:`3px solid ${t.type==="success"?"#22c55e":"#f87171"}`}}>
              <p className="f-syne" style={{fontSize:13,fontWeight:700,color:"#f8f8ff",margin:"0 0 2px"}}>{t.title}</p>
              <p className="f-dm" style={{fontSize:12,color:"#6b7280",margin:0}}>{t.msg}</p>
            </div>
          ))}
        </div>

        <aside className="glass" style={{width:220,flexShrink:0,display:"flex",flexDirection:"column",padding:"20px 12px",borderRight:"1px solid rgba(255,255,255,.06)",position:"fixed",top:0,left:0,height:"100vh",zIndex:50}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",marginBottom:24}}>
            <div className="glow-v" style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#7c3aed,#4f46e5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Zap size={16} style={{color:"white"}}/>
            </div>
            <div>
              <p className="f-syne grad-text" style={{fontSize:12,fontWeight:700,margin:0}}>CampusFlow</p>
              <p className="f-dm" style={{fontSize:10,color:"#374151",margin:0}}>Counsellor</p>
            </div>
          </div>
          <nav style={{flex:1,display:"flex",flexDirection:"column",gap:4}}>
            {NAV.map(n=>(
              <button key={n.id} className={`nav-it${tab===n.id?" on":""}`} onClick={()=>setTab(n.id)} style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:10,color:tab===n.id?"#c4b5fd":"#4b5563"}}>
                <n.icon size={15}/><span className="f-dm" style={{fontSize:13,fontWeight:500}}>{n.label}</span>
              </button>
            ))}
          </nav>
          <button onClick={handleLogout} className="nav-it" style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:10,color:"#4b5563"}}>
            <LogOut size={15}/><span className="f-dm" style={{fontSize:13}}>Logout</span>
          </button>
        </aside>

        <div style={{flex:1,marginLeft:220,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
          <header className="glass" style={{padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.06)",position:"sticky",top:0,zIndex:30,background:"rgba(7,7,15,.88)"}}>
            <div>
              <p className="f-syne" style={{fontSize:13,fontWeight:600,color:"#f8f8ff",margin:0}}>Counsellor Portal</p>
              <p className="f-dm" style={{fontSize:11,color:"#374151",margin:0}}>Zenith CampusFlow</p>
            </div>
            <div className="glass glass-hi" style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",borderRadius:12,cursor:"pointer"}}>
              <Av name={profile?.name} sz="sm"/>
              <span className="f-dm" style={{fontSize:12,color:"#d1d5db"}}>{profile?.name}</span>
            </div>
          </header>

          <main style={{flex:1,overflowY:"auto",padding:"28px 24px",background:"radial-gradient(ellipse 700px 400px at 65% 8%,rgba(109,40,217,.06) 0%,transparent 55%),#07070f"}}>

            {tab==="overview" && (
              <div style={{display:"flex",flexDirection:"column",gap:24}}>
                <h1 className="f-syne au" style={{fontSize:18,fontWeight:700,color:"#f8f8ff",margin:0}}>Welcome, <span className="grad-text">{profile?.name?.split(" ")[0]}</span> 👋</h1>
                <div className="au1" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14}}>
                  <div className="glass cshadow sc-hover" style={{borderRadius:18,padding:"18px 20px"}}><p className="f-syne" style={{fontSize:20,fontWeight:700,color:"#f8f8ff",margin:"0 0 4px"}}>{visits.length}</p><p className="f-dm" style={{fontSize:11,color:"#6b7280",margin:0}}>Total Visits</p></div>
                  <div className="glass cshadow sc-hover" style={{borderRadius:18,padding:"18px 20px"}}><p className="f-syne" style={{fontSize:20,fontWeight:700,color:"#4ade80",margin:"0 0 4px"}}>{visits.filter(v=>v.status==="completed").length}</p><p className="f-dm" style={{fontSize:11,color:"#6b7280",margin:0}}>Completed</p></div>
                  <div className="glass cshadow sc-hover" style={{borderRadius:18,padding:"18px 20px"}}><p className="f-syne" style={{fontSize:20,fontWeight:700,color:"#a78bfa",margin:"0 0 4px"}}>{onDuty.length}</p><p className="f-dm" style={{fontSize:11,color:"#6b7280",margin:0}}>Interns On Duty</p></div>
                </div>
                <div className="au2 glass cshadow" style={{borderRadius:18,padding:20}}>
                  <p className="f-syne" style={{fontSize:13,fontWeight:700,color:"#f8f8ff",margin:"0 0 14px"}}>On-Duty Interns</p>
                  {onDuty.length===0 ? <p className="f-dm" style={{color:"#374151",fontSize:13}}>No interns on duty right now.</p>
                  : onDuty.map((intern,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div className="live-dot" style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",flexShrink:0}}/>
                      <Av name={intern.name} sz="sm"/>
                      <span className="f-dm" style={{fontSize:13,color:"#d1d5db"}}>{intern.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="assign" && (
              <div style={{display:"flex",flexDirection:"column",gap:24,maxWidth:520}}>
                <h1 className="f-syne au" style={{fontSize:18,fontWeight:700,color:"#f8f8ff",margin:0}}>Assign Visit</h1>
                <div className="au1 glass cshadow" style={{borderRadius:18,padding:24}}>
                  <input style={inp} placeholder="Student Name" value={form.studentName} onChange={e=>setForm(f=>({...f,studentName:e.target.value}))}/>
                  <input style={inp} placeholder="Student Phone" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
                  <select style={{...inp,marginBottom:16}} value={form.course} onChange={e=>setForm(f=>({...f,course:e.target.value}))}>
                    {COURSES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <p className="f-syne" style={{fontSize:12,fontWeight:700,color:"#6b7280",margin:"0 0 10px",letterSpacing:.5}}>SELECT INTERN</p>
                  {onDuty.length===0 ? <p className="f-dm" style={{color:"#374151",fontSize:13,marginBottom:16}}>No interns on duty right now.</p>
                  : onDuty.map(intern=>(
                    <div key={intern.uid} onClick={()=>setForm(f=>({...f,internUid:intern.uid}))}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,marginBottom:8,cursor:"pointer",border:`1px solid ${form.internUid===intern.uid?"rgba(139,92,246,.6)":"rgba(255,255,255,.07)"}`,background:form.internUid===intern.uid?"rgba(124,58,237,.15)":"rgba(255,255,255,.03)"}}>
                      <Av name={intern.name} sz="sm"/>
                      <span className="f-dm" style={{fontSize:13,color:"#d1d5db"}}>{intern.name}</span>
                      {form.internUid===intern.uid && <span style={{marginLeft:"auto",color:"#a78bfa",fontSize:12}}>✓ Selected</span>}
                    </div>
                  ))}
                  <button className="btn-v" onClick={assignVisit} disabled={submitting}
                    style={{width:"100%",padding:"13px 0",borderRadius:12,fontSize:14,fontWeight:700,marginTop:8,opacity:submitting?.6:1}}>
                    {submitting?"Assigning...":"Assign Visit"}
                  </button>
                </div>
              </div>
            )}

            {tab==="visits" && (
              <div style={{display:"flex",flexDirection:"column",gap:24}}>
                <h1 className="f-syne au" style={{fontSize:18,fontWeight:700,color:"#f8f8ff",margin:0}}>Live Visits</h1>
                <div className="au1 glass cshadow" style={{borderRadius:18,overflow:"hidden"}}>
                  <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",gap:8}}>
                    <div className="live-dot" style={{width:7,height:7,borderRadius:"50%",background:"#22c55e"}}/>
                    <span className="f-syne" style={{fontSize:12,fontWeight:600,color:"#f8f8ff"}}>All Visits ({visits.length})</span>
                  </div>
                  {visits.length===0 ? <div style={{padding:"32px 20px",textAlign:"center"}}><p className="f-dm" style={{color:"#374151",fontSize:13}}>No visits yet. Assign one!</p></div>
                  : visits.map((v,i)=>(
                    <div key={i} className="glass-hi" style={{padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,.04)",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{flex:1}}>
                        <p className="f-syne" style={{fontSize:13,fontWeight:500,color:"#d1d5db",margin:"0 0 2px"}}>{v.studentName}</p>
                        <p className="f-dm" style={{fontSize:11,color:"#4b5563",margin:0}}>{v.course} · Intern: {v.internName}</p>
                      </div>
                      <Badge v={v.status==="completed"?"green":v.status==="in_progress"?"amber":"violet"}>{v.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="interns" && (
              <div style={{display:"flex",flexDirection:"column",gap:24}}>
                <h1 className="f-syne au" style={{fontSize:18,fontWeight:700,color:"#f8f8ff",margin:0}}>Interns</h1>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
                  {interns.map((intern,i)=>(
                    <div key={i} className="au1 glass cshadow sc-hover" style={{borderRadius:18,padding:20}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                        <Av name={intern.name}/>
                        <div>
                          <p className="f-syne" style={{fontSize:13,fontWeight:700,color:"#f8f8ff",margin:0}}>{intern.name}</p>
                          <p className="f-dm" style={{fontSize:11,color:"#4b5563",margin:0}}>{intern.email}</p>
                        </div>
                      </div>
                      <Badge v={intern.isOnDuty?"green":"violet"}>{intern.isOnDuty?"On Duty":"Off Duty"}</Badge>
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
