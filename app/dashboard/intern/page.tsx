"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";
import {
  MapPin, Star, Camera, CheckCircle, LogOut, Activity,
  Navigation, ToggleLeft, ToggleRight, Zap, Clock, Image as ImageIcon
} from "lucide-react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
*,*::before,*::after{box-sizing:border-box;}body{margin:0;}
.f-syne{font-family:'Syne',sans-serif!important;}.f-dm{font-family:'DM Sans',sans-serif!important;}
@keyframes floatA{0%,100%{transform:translate(0,0) scale(1);}40%{transform:translate(40px,-40px) scale(1.06);}70%{transform:translate(-25px,25px) scale(0.94);}}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse2{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.5);opacity:.5;}}
@keyframes toastIn{from{opacity:0;transform:translateX(110px) scale(.95);}to{opacity:1;transform:translateX(0) scale(1);}}
.orb1{animation:floatA 14s ease-in-out infinite;}
.au{animation:fadeUp .55s cubic-bezier(.16,1,.3,1) both;}.au1{animation:fadeUp .55s cubic-bezier(.16,1,.3,1) .08s both;}.au2{animation:fadeUp .55s cubic-bezier(.16,1,.3,1) .16s both;}.au3{animation:fadeUp .55s cubic-bezier(.16,1,.3,1) .24s both;}
.live-dot{animation:pulse2 1.6s ease-in-out infinite;}.toast-in{animation:toastIn .42s cubic-bezier(.16,1,.3,1) both;}
.glass{background:rgba(255,255,255,.04);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,.07);}
.glass-hi:hover{background:rgba(255,255,255,.06)!important;border-color:rgba(139,92,246,.22)!important;transition:all .22s;}
.glow-v{box-shadow:0 0 44px rgba(124,58,237,.38),0 0 90px rgba(124,58,237,.14);}
.cshadow{box-shadow:0 6px 36px rgba(0,0,0,.45),0 1px 0 rgba(255,255,255,.04) inset;}
.grad-text{background:linear-gradient(135deg,#c4b5fd 0%,#8b5cf6 50%,#6d28d9 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.btn-v{background:linear-gradient(135deg,#7c3aed,#6d28d9);transition:all .2s;border:none;cursor:pointer;color:white;}
.btn-v:hover{background:linear-gradient(135deg,#8b5cf6,#7c3aed);transform:translateY(-1px);box-shadow:0 10px 28px rgba(124,58,237,.42);}
.cp-btn{transition:all .2s cubic-bezier(.16,1,.3,1);cursor:pointer;background:none;width:100%;text-align:left;}
.cp-btn:hover{transform:scale(1.04);border-color:rgba(139,92,246,.45)!important;}
.cp-btn.active{background:rgba(124,58,237,.22)!important;border-color:rgba(139,92,246,.6)!important;}
.nav-it{transition:all .18s;cursor:pointer;border:none;background:none;width:100%;text-align:left;}
.nav-it:hover{background:rgba(139,92,246,.1);border-radius:.75rem;}.nav-it.on{background:rgba(124,58,237,.2);border-radius:.75rem;border-left:2px solid #8b5cf6;}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(139,92,246,.35);border-radius:2px;}
input,select{outline:none!important;font-family:'DM Sans',sans-serif;}
`;

const CHECKPOINTS = [
  {id:"zenith_office",label:"Zenith Office",icon:"🏢"},{id:"a_block",label:"A Block",icon:"🏗️"},
  {id:"d_block",label:"D Block",icon:"🏛️"},{id:"dedicated_floor",label:"Dedicated Floor",icon:"🔝"},
  {id:"reception",label:"Reception",icon:"🎪"},{id:"library",label:"Library",icon:"📚"},
  {id:"canteen",label:"Canteen",icon:"🍽️"},{id:"hostel",label:"Hostel",icon:"🏠"},
  {id:"off_campus",label:"Off Campus",icon:"🌍"},{id:"cabin",label:"Cabin",icon:"🪵"},
];

const NAV = [{id:"overview",icon:Activity,label:"Overview"},{id:"visits",icon:Navigation,label:"My Visits"},{id:"attendance",icon:Clock,label:"Attendance"}];

const Av = ({ name, sz="md" }: any) => {
  const init = name?name.split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase():"?";
  const s = sz==="sm"?28:36;
  return <div style={{width:s,height:s,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#4f46e5)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span className="f-syne" style={{fontSize:sz==="sm"?10:12,fontWeight:700,color:"white"}}>{init}</span></div>;
};

const Badge = ({ children, v="violet" }: any) => {
  const colors: any = {violet:{bg:"rgba(124,58,237,.18)",color:"#a78bfa"},green:{bg:"rgba(34,197,94,.15)",color:"#4ade80"},amber:{bg:"rgba(245,158,11,.15)",color:"#fbbf24"}};
  const c = colors[v]||colors.violet;
  return <span className="f-syne" style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:c.bg,color:c.color,letterSpacing:.4}}>{children}</span>;
};

export default function InternDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab]                   = useState("overview");
  const [activeVisit, setActiveVisit]   = useState<any>(null);
  const [activeCP, setActiveCP]         = useState<string|null>(null);
  const [myVisits, setMyVisits]         = useState<any[]>([]);
  const [toasts, setToasts]             = useState<any[]>([]);
  const [mob, setMob]                   = useState(false);

  const toast = useCallback((type: string, title: string, msg: string) => {
    const id = Date.now();
    setToasts(t=>[...t,{id,type,title,msg}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4000);
  },[]);

  useEffect(()=>{
    if(!loading && !profile) router.push("/login");
    if(!loading && profile && profile.role!=="intern") router.push("/");
  },[profile,loading]);

  useEffect(()=>{
    if(!user) return;
    const unsub = onValue(ref(db,"visits"),(snap)=>{
      if(snap.exists()){
        const all = Object.entries(snap.val()).map(([id,v]:any)=>({id,...v}));
        const mine = all.filter((v:any)=>v.internUid===user.uid);
        setMyVisits(mine);
        const active = mine.find((v:any)=>v.status!=="completed");
        setActiveVisit(active||null);
      } else {
        setMyVisits([]);
        setActiveVisit(null);
      }
    });
    return unsub;
  },[user]);

  const toggleDuty = async () => {
    if(!user) return;
    await update(ref(db,`users/${user.uid}`),{isOnDuty:!profile?.isOnDuty});
    toast("success", profile?.isOnDuty?"Gone Off Duty":"Now On Duty", profile?.isOnDuty?"You are now off duty.":"You are now on duty and visible to counsellors.");
  };

  const hitCheckpoint = async (cpId: string) => {
    if(!activeVisit) { toast("error","No Active Visit","You need an assigned visit first."); return; }
    setActiveCP(cpId);
    const checkpoints = [...(activeVisit.checkpoints||[]),cpId];
    const isFirst = checkpoints.length===1;
    await update(ref(db,`visits/${activeVisit.id}`),{
      checkpoints,
      currentCheckpoint: cpId,
      status: isFirst?"started":"in_progress",
      ...(isFirst?{startedAt:Date.now()}:{}),
    });
    const cp = CHECKPOINTS.find(c=>c.id===cpId);
    toast("success",`📍 ${cp?.label}`,"Checkpoint recorded!");
  };

  const completeVisit = async () => {
    if(!activeVisit) return;
    await update(ref(db,`visits/${activeVisit.id}`),{status:"completed",completedAt:Date.now()});
    toast("success","Visit Completed! 🎉","Great job! The visit has been marked complete.");
    setActiveCP(null);
  };

  const handleLogout = async () => { await logout(); router.push("/login"); };

  const STEPS = ["Assigned","Started","In Progress","Completed"];
  const stepIndex = activeVisit ? (activeVisit.status==="assigned"?0:activeVisit.status==="started"?1:activeVisit.status==="in_progress"?2:3) : -1;

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

        {/* Mobile overlay */}
        {mob && <div onClick={()=>setMob(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:40}}/>}

        <aside className="glass" style={{width:220,flexShrink:0,display:"flex",flexDirection:"column",padding:"20px 12px",borderRight:"1px solid rgba(255,255,255,.06)",position:"fixed",top:0,left:0,height:"100vh",zIndex:50,overflowY:"auto",transition:"transform .28s cubic-bezier(.16,1,.3,1)",transform:mob?"translateX(0)":"translateX(-220px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",marginBottom:24}}>
            <div className="glow-v" style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#7c3aed,#4f46e5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Zap size={16} style={{color:"white"}}/>
            </div>
            <div>
              <p className="f-syne grad-text" style={{fontSize:12,fontWeight:700,margin:0}}>CampusFlow</p>
              <p className="f-dm" style={{fontSize:10,color:"#374151",margin:0}}>Campus Buddy</p>
            </div>
          </div>
          <nav style={{flex:1,display:"flex",flexDirection:"column",gap:4}}>
            {NAV.map(n=>(
              <button key={n.id} className={`nav-it${tab===n.id?" on":""}`} onClick={()=>{setTab(n.id);setMob(false);}} style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:10,color:tab===n.id?"#c4b5fd":"#4b5563"}}>
                <n.icon size={15}/><span className="f-dm" style={{fontSize:13,fontWeight:500}}>{n.label}</span>
              </button>
            ))}
          </nav>
          <button onClick={handleLogout} className="nav-it" style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:10,color:"#4b5563"}}>
            <LogOut size={15}/><span className="f-dm" style={{fontSize:13}}>Logout</span>
          </button>
        </aside>

        <div style={{flex:1,marginLeft:0,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
          <header className="glass" style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.06)",position:"sticky",top:0,zIndex:30,background:"rgba(7,7,15,.88)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>setMob(!mob)} style={{background:"none",border:"none",cursor:"pointer",padding:4,color:"#6b7280"}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <div>
                <p className="f-syne" style={{fontSize:13,fontWeight:600,color:"#f8f8ff",margin:0}}>Campus Buddy</p>
                <p className="f-dm" style={{fontSize:11,color:"#374151",margin:0}}>Zenith CampusFlow</p>
              </div>
            </div>
            <div className="glass glass-hi" style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",borderRadius:12,cursor:"pointer"}}>
              <Av name={profile?.name} sz="sm"/>
              <span className="f-dm" style={{fontSize:12,color:"#d1d5db"}}>{profile?.name}</span>
            </div>
          </header>

          <main style={{flex:1,overflowY:"auto",padding:"28px 24px",background:"radial-gradient(ellipse 700px 400px at 65% 8%,rgba(109,40,217,.06) 0%,transparent 55%),#07070f"}}>

            {tab==="overview" && (
              <div style={{display:"flex",flexDirection:"column",gap:22}}>
                <h1 className="f-syne au" style={{fontSize:18,fontWeight:700,color:"#f8f8ff",margin:0}}>
                  Hey, <span className="grad-text">{profile?.name?.split(" ")[0]}</span> 👋
                </h1>

                {/* Duty Toggle */}
                <div className="au1 glass cshadow" style={{borderRadius:18,padding:22,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <p className="f-syne" style={{fontSize:15,fontWeight:700,color:"#f8f8ff",margin:"0 0 4px"}}>Duty Status</p>
                    <p className="f-dm" style={{fontSize:11,color:"#6b7280",margin:0}}>{profile?.isOnDuty?"You are visible to counsellors":"Toggle on to receive visit assignments"}</p>
                  </div>
                  <button onClick={toggleDuty} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
                    {profile?.isOnDuty
                      ? <ToggleRight size={44} style={{color:"#22c55e"}}/>
                      : <ToggleLeft  size={44} style={{color:"#374151"}}/>}
                  </button>
                </div>

                {/* Active Visit */}
                {activeVisit ? (
                  <div className="au2 glass cshadow" style={{borderRadius:18,padding:22}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                      <p className="f-syne" style={{fontSize:13,fontWeight:600,color:"#f8f8ff",margin:0}}>Active Visit</p>
                      <Badge v="amber">In Progress</Badge>
                    </div>
                    <p className="f-syne" style={{fontSize:18,fontWeight:800,color:"#f8f8ff",margin:"0 0 4px"}}>{activeVisit.studentName}</p>
                    <p className="f-dm" style={{fontSize:12,color:"#4b5563",margin:"0 0 16px"}}>{activeVisit.course}</p>

                    {/* Progress bar */}
                    <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:20}}>
                      {STEPS.map((s,i)=>(
                        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                          <div style={{width:24,height:24,borderRadius:"50%",background:i<=stepIndex?"#7c3aed":"rgba(255,255,255,.08)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .3s"}}>
                            {i<stepIndex ? <CheckCircle size={12} style={{color:"white"}}/> : <span style={{width:8,height:8,borderRadius:"50%",background:i===stepIndex?"white":"rgba(255,255,255,.2)",display:"block"}}/>}
                          </div>
                          <span className="f-dm" style={{fontSize:9,color:i<=stepIndex?"#a78bfa":"#374151",textAlign:"center"}}>{s}</span>
                          {i<STEPS.length-1 && <div style={{position:"absolute"}}/>}
                        </div>
                      ))}
                    </div>

                    {/* Checkpoints */}
                    <p className="f-syne" style={{fontSize:12,fontWeight:700,color:"#6b7280",margin:"0 0 10px",letterSpacing:.5}}>TAP CHECKPOINT</p>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:16}}>
                      {CHECKPOINTS.map(cp=>(
                        <button key={cp.id} onClick={()=>hitCheckpoint(cp.id)}
                          className={`cp-btn glass${activeCP===cp.id?" active":""}`}
                          style={{borderRadius:12,padding:"10px 12px",border:"1px solid rgba(255,255,255,.08)",display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:16}}>{cp.icon}</span>
                          <span className="f-dm" style={{fontSize:12,color:"#d1d5db"}}>{cp.label}</span>
                          {activeCP===cp.id && <CheckCircle size={12} style={{color:"#22c55e",marginLeft:"auto"}}/>}
                        </button>
                      ))}
                    </div>
                    <button className="btn-v" onClick={completeVisit} style={{width:"100%",padding:"12px 0",borderRadius:12,fontSize:14,fontWeight:700}}>
                      Mark Visit Complete ✓
                    </button>
                  </div>
                ) : (
                  <div className="au2 glass cshadow" style={{borderRadius:18,padding:32,textAlign:"center"}}>
                    <Navigation size={32} style={{color:"#374151",marginBottom:12}}/>
                    <p className="f-syne" style={{fontSize:14,fontWeight:700,color:"#4b5563",margin:"0 0 6px"}}>No Active Visit</p>
                    <p className="f-dm" style={{fontSize:12,color:"#374151",margin:0}}>Turn on duty to receive assignments from counsellors.</p>
                  </div>
                )}
              </div>
            )}

            {tab==="visits" && (
              <div style={{display:"flex",flexDirection:"column",gap:22}}>
                <h1 className="f-syne au" style={{fontSize:18,fontWeight:700,color:"#f8f8ff",margin:0}}>My Visits</h1>
                <div className="au1 glass cshadow" style={{borderRadius:18,overflow:"hidden"}}>
                  <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                    <span className="f-syne" style={{fontSize:12,fontWeight:600,color:"#f8f8ff"}}>Visit History ({myVisits.length})</span>
                  </div>
                  {myVisits.length===0 ? <div style={{padding:"32px 20px",textAlign:"center"}}><p className="f-dm" style={{color:"#374151",fontSize:13}}>No visits yet.</p></div>
                  : myVisits.map((v,i)=>(
                    <div key={i} className="glass-hi" style={{padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,.04)",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{flex:1}}>
                        <p className="f-syne" style={{fontSize:13,fontWeight:500,color:"#d1d5db",margin:"0 0 2px"}}>{v.studentName}</p>
                        <p className="f-dm" style={{fontSize:11,color:"#4b5563",margin:0}}>{v.course}</p>
                      </div>
                      <Badge v={v.status==="completed"?"green":v.status==="in_progress"?"amber":"violet"}>{v.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="attendance" && (
              <div style={{display:"flex",flexDirection:"column",gap:22}}>
                <h1 className="f-syne au" style={{fontSize:18,fontWeight:700,color:"#f8f8ff",margin:0}}>My Attendance</h1>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,maxWidth:600}}>
                  {[
                    {label:"Total Visits",  val:myVisits.length,                                        color:"#f8f8ff"},
                    {label:"Completed",     val:myVisits.filter((v:any)=>v.status==="completed").length, color:"#4ade80"},
                    {label:"Duty Status",   val:profile?.isOnDuty?"ON":"OFF",                           color:"#a78bfa"},
                  ].map((item,i)=>(
                    <div key={i} className={`au${i+1} glass cshadow`} style={{borderRadius:16,padding:"20px 22px"}}>
                      <p style={{fontSize:24,fontWeight:700,color:item.color,margin:"0 0 6px",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{item.val}</p>
                      <p className="f-dm" style={{fontSize:11,color:"#6b7280",margin:0}}>{item.label}</p>
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