"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";
import { ref, onValue, update, push, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { LogOut, Activity, Navigation, Clock, CheckCircle, Plus } from "lucide-react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;}body{margin:0;}
.f{font-family:'Inter',sans-serif;}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
.au{animation:fadeUp .3s ease both;}.au1{animation:fadeUp .3s ease .05s both;}.au2{animation:fadeUp .3s ease .1s both;}.au3{animation:fadeUp .3s ease .15s both;}
.dot{animation:pulse 2s ease infinite;}
.card{background:#100c1c;border:1px solid #1e1530;border-radius:10px;}
.nav-item{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;cursor:pointer;border:none;background:none;width:100%;text-align:left;color:#8b7aaa;font-size:13px;font-family:'Inter',sans-serif;transition:all .15s;}
.nav-item:hover{background:rgba(124,58,237,.1);color:#c4b5fd;}.nav-item.active{background:rgba(124,58,237,.18);color:#e0d0ff;}
.badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;font-family:'Inter',sans-serif;}
.row{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #160f28;}
.row:last-child{border-bottom:none;}
.row:hover{background:rgba(124,58,237,.04);}
.cp{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;border:1px solid #1f1f1f;cursor:pointer;transition:all .15s;background:none;width:100%;font-family:'Inter',sans-serif;}
.cp:hover{border-color:#2a2a2a;background:#111;}
.cp.active{border-color:#7c3aed;background:rgba(124,58,237,.06);}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:#1f1f1f;border-radius:2px;}
`;

const COURSES = ["AI & Machine Learning","Data Science","Full Stack Dev","Cloud Computing","Cybersecurity","UI/UX Design"];
const CHECKPOINTS = [
  {id:"zenith_office",label:"Zenith Office",e:"🏢"},{id:"a_block",label:"A Block",e:"🏗️"},
  {id:"d_block",label:"D Block",e:"🏛️"},{id:"dedicated_floor",label:"Dedicated Floor",e:"🔝"},
  {id:"reception",label:"Reception",e:"🎪"},{id:"library",label:"Library",e:"📚"},
  {id:"canteen",label:"Canteen",e:"🍽️"},{id:"hostel",label:"Hostel",e:"🏠"},
  {id:"off_campus",label:"Off Campus",e:"🌍"},{id:"cabin",label:"Cabin",e:"🪵"},
];
const NAV = [{id:"overview",icon:Activity,label:"Overview"},{id:"visits",icon:Navigation,label:"My Visits"},{id:"attendance",icon:Clock,label:"Attendance"}];
const STEPS = ["Assigned","Started","In Progress","Completed"];

const Av = ({name,size=28}:any) => {
  const i=name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase()||"?";
  return <div style={{width:size,height:size,borderRadius:"50%",background:"#1e1530",border:"1px solid #2a1f45",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:size>30?12:10,fontWeight:600,color:"#fff"}}>{i}</span></div>;
};

const Badge = ({children,color="purple"}:any) => {
  const c:any={purple:{bg:"rgba(167,139,250,.12)",color:"#c4b5fd"},green:{bg:"rgba(34,197,94,.1)",color:"#4ade80"},amber:{bg:"rgba(245,158,11,.1)",color:"#fbbf24"},gray:{bg:"#1a1a1a",color:"#8b7aaa"}};
  return <span className="badge" style={{background:c[color]?.bg,color:c[color]?.color}}>{children}</span>;
};

const StudentForm = ({visitId, course}:{visitId:string,course:string}) => {
  const [name,setName] = useState("");
  const [phone,setPhone] = useState("");
  const [saving,setSaving] = useState(false);

  const save = async () => {
    if(!name) return;
    setSaving(true);
    await update(ref(db,`visits/${visitId}`),{studentName:name,phone,status:"started",startedAt:Date.now()});
    setSaving(false);
  };

  return (
    <div>
      <input style={{width:"100%",background:"#0a0810",border:"1px solid #1e1530",borderRadius:8,padding:"9px 12px",color:"#f0ecff",fontSize:13,fontFamily:"Inter,sans-serif",outline:"none",marginBottom:8,boxSizing:"border-box"}}
        placeholder="Student name *" value={name} onChange={e=>setName(e.target.value)}/>
      <input style={{width:"100%",background:"#0a0810",border:"1px solid #1e1530",borderRadius:8,padding:"9px 12px",color:"#f0ecff",fontSize:13,fontFamily:"Inter,sans-serif",outline:"none",marginBottom:10,boxSizing:"border-box"}}
        placeholder="Phone number (optional)" value={phone} onChange={e=>setPhone(e.target.value)}/>
      <button onClick={save} disabled={saving||!name}
        style={{width:"100%",background:name?"#fff":"#1a1a1a",color:name?"#000":"#444",borderRadius:8,padding:"9px 0",fontSize:13,fontWeight:600,cursor:name?"pointer":"default",border:"none",fontFamily:"Inter,sans-serif",transition:"all .2s"}}>
        {saving?"Saving...":"Start Visit"}
      </button>
    </div>
  );
};

export default function InternDashboard() {
  const {user,profile,loading} = useAuth();
  const router = useRouter();
  const [tab,setTab] = useState("overview");
  const [mob,setMob] = useState(false);
  const [activeVisit,setActiveVisit] = useState<any>(null);
  const [activeCP,setActiveCP] = useState<string|null>(null);
  const [myVisits,setMyVisits] = useState<any[]>([]);
  const [toast,setToast] = useState("");

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  useEffect(()=>{ if(!loading&&!profile) router.push("/login"); if(!loading&&profile&&profile.role!=="intern") router.push("/"); },[profile,loading]);
  useEffect(()=>{
    if(!user) return;
    return onValue(ref(db,"visits"),s=>{
      if(s.exists()){
        const all=Object.entries(s.val()).map(([id,v]:any)=>({id,...v}));
        const mine=all.filter((v:any)=>v.internUid===user.uid);
        setMyVisits(mine);
        setActiveVisit(mine.find((v:any)=>v.status!=="completed")||null);
      } else { setMyVisits([]); setActiveVisit(null); }
    });
  },[user]);

  const [showSelfAssign, setShowSelfAssign] = useState(false);
  const [selfForm, setSelfForm] = useState({studentName:"",phone:"",course:COURSES[0]});
  const [selfSaving, setSelfSaving] = useState(false);

  const selfAssignVisit = async () => {
    if(!selfForm.studentName||!user) return;
    setSelfSaving(true);
    const vRef = push(ref(db,"visits"));
    await set(vRef,{
      studentName: selfForm.studentName,
      phone: selfForm.phone,
      course: selfForm.course,
      internUid: user.uid,
      internName: profile?.name||"",
      counsellorUid: "",
      counsellorName: "Self Assigned",
      status: "started",
      checkpoints: [],
      startedAt: Date.now(),
      createdAt: Date.now(),
    });
    showToast("Visit started!");
    setSelfForm({studentName:"",phone:"",course:COURSES[0]});
    setShowSelfAssign(false);
    setSelfSaving(false);
  };
    if(!user) return;
    await update(ref(db,`users/${user.uid}`),{isOnDuty:!profile?.isOnDuty});
    showToast(profile?.isOnDuty?"You are now off duty":"You are now on duty");
  };

  const hitCheckpoint = async (cpId:string) => {
    if(!activeVisit){ showToast("No active visit assigned"); return; }
    setActiveCP(cpId);
    const checkpoints=[...(activeVisit.checkpoints||[]),cpId];
    await update(ref(db,`visits/${activeVisit.id}`),{checkpoints,currentCheckpoint:cpId,status:checkpoints.length===1?"started":"in_progress",...(checkpoints.length===1?{startedAt:Date.now()}:{})});
    showToast(`📍 ${CHECKPOINTS.find(c=>c.id===cpId)?.label}`);
  };

  const completeVisit = async () => {
    if(!activeVisit) return;
    await update(ref(db,`visits/${activeVisit.id}`),{status:"completed",completedAt:Date.now()});
    showToast("Visit completed! 🎉");
    setActiveCP(null);
  };

  const stepIdx = activeVisit?({assigned:0,started:1,in_progress:2,completed:3} as any)[activeVisit.status]??0:-1;

  if(loading) return <div style={{background:"#08060f",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:"#6b5a88",fontFamily:"Inter,sans-serif",fontSize:13}}>Loading...</p></div>;

  return (
    <>
      <style>{CSS}</style>
      {toast && <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"#1a1230",border:"1px solid #2a1f45",borderRadius:8,padding:"10px 16px",color:"#fff",fontSize:12,zIndex:100,fontFamily:"Inter,sans-serif",whiteSpace:"nowrap"}}>{toast}</div>}
      <div className="f" style={{display:"flex",minHeight:"100vh",background:"#08060f"}}>

        {mob && <div onClick={()=>setMob(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:40}}/>}

        <aside style={{width:200,flexShrink:0,display:"flex",flexDirection:"column",padding:"16px 10px",borderRight:"1px solid #141414",position:"fixed",top:0,left:0,height:"100vh",background:"#08060f",zIndex:50,transition:"transform .25s",transform:mob?"translateX(0)":"translateX(-200px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",marginBottom:20}}>
            <div style={{width:22,height:22,borderRadius:6,background:"linear-gradient(135deg,#7c3aed,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center"}}>
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
                <p style={{fontSize:10,color:"#9d8cbb",margin:0}}>Campus Buddy</p>
              </div>
            </div>
            <button className="nav-item" onClick={async()=>{await logout();router.push("/login");}}>
              <LogOut size={14}/>Logout
            </button>
          </div>
        </aside>

        <div style={{flex:1,display:"flex",flexDirection:"column"}}>
          <header style={{padding:"12px 16px",borderBottom:"1px solid #141414",position:"sticky",top:0,background:"#08060f",zIndex:30,display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setMob(!mob)} style={{background:"none",border:"none",cursor:"pointer",padding:4,color:"#8b7aaa",display:"flex",alignItems:"center"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <p style={{fontSize:13,fontWeight:500,color:"#b09fd0",margin:0,flex:1}}>Campus Buddy</p>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:profile?.isOnDuty?"#22c55e":"#333"}}/>
              <span style={{fontSize:11,color:profile?.isOnDuty?"#22c55e":"#444"}}>{profile?.isOnDuty?"On Duty":"Off Duty"}</span>
            </div>
          </header>

          <main style={{flex:1,padding:"20px 16px",overflowY:"auto"}}>

            {tab==="overview" && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="au">
                  <p style={{fontSize:18,fontWeight:600,color:"#fff",margin:"0 0 2px"}}>Hey, {profile?.name?.split(" ")[0]} 👋</p>
                  <p style={{fontSize:13,color:"#9d8cbb",margin:0}}>Ready for today?</p>
                </div>

                {/* Duty Toggle */}
                <div className="au1 card" style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <p style={{fontSize:13,fontWeight:500,color:"#f0ecff",margin:"0 0 2px"}}>Duty Status</p>
                    <p style={{fontSize:11,color:"#9d8cbb",margin:0}}>{profile?.isOnDuty?"Visible to counsellors":"Toggle on to start receiving visits"}</p>
                  </div>
                  <button onClick={toggleDuty} style={{background:profile?.isOnDuty?"#22c55e":"#1a1a1a",border:`1px solid ${profile?.isOnDuty?"#22c55e":"#2a2a2a"}`,borderRadius:20,padding:"5px 14px",color:profile?.isOnDuty?"#000":"#555",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",transition:"all .2s"}}>
                    {profile?.isOnDuty?"On Duty":"Off Duty"}
                  </button>
                </div>

                {/* Active Visit */}
                {activeVisit ? (
                  <div className="au2 card" style={{padding:16}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                      <p style={{fontSize:13,fontWeight:500,color:"#fff",margin:0}}>Active Visit</p>
                      <Badge color="amber">In Progress</Badge>
                    </div>

                    {/* Assigned by counsellor */}
                    <div style={{background:"#0a0810",border:"1px solid #1a1a1a",borderRadius:8,padding:"8px 12px",marginBottom:12}}>
                      <p style={{fontSize:11,color:"#9d8cbb",margin:"0 0 2px"}}>Assigned by</p>
                      <p style={{fontSize:13,fontWeight:500,color:"#f0ecff",margin:0}}>{activeVisit.counsellorName||"Counsellor"}</p>
                    </div>

                    {/* Student name input if not filled */}
                    {!activeVisit.studentName ? (
                      <div style={{marginBottom:12}}>
                        <p style={{fontSize:11,fontWeight:500,color:"#9d8cbb",margin:"0 0 6px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Student Details</p>
                        <StudentForm visitId={activeVisit.id} course={activeVisit.course}/>
                      </div>
                    ) : (
                      <>
                        <p style={{fontSize:16,fontWeight:600,color:"#fff",margin:"0 0 2px"}}>{activeVisit.studentName}</p>
                        <p style={{fontSize:12,color:"#9d8cbb",margin:"0 0 16px"}}>{activeVisit.course} {activeVisit.phone && `· ${activeVisit.phone}`}</p>
                      </>
                    )}

                    {/* Progress Steps */}
                    <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:16}}>
                      {STEPS.map((s,i)=>(
                        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                          <div style={{width:20,height:20,borderRadius:"50%",background:i<=stepIdx?"#7c3aed":"#1a1a1a",border:`1px solid ${i<=stepIdx?"#7c3aed":"#2a2a2a"}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .3s"}}>
                            {i<stepIdx ? <CheckCircle size={10} style={{color:"white"}}/> : <div style={{width:6,height:6,borderRadius:"50%",background:i===stepIdx?"#fff":"#333"}}/>}
                          </div>
                          <span style={{fontSize:9,color:i<=stepIdx?"#7c3aed":"#333",textAlign:"center"}}>{s}</span>
                        </div>
                      ))}
                    </div>

                    {/* Checkpoints */}
                    <p style={{fontSize:11,fontWeight:500,color:"#6b5a88",margin:"0 0 8px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Tap Checkpoint</p>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
                      {CHECKPOINTS.map(cp=>(
                        <button key={cp.id} className={`cp${activeCP===cp.id?" active":""}`} onClick={()=>hitCheckpoint(cp.id)}>
                          <span style={{fontSize:14}}>{cp.e}</span>
                          <span style={{fontSize:12,color:"#d4c5fd",flex:1,textAlign:"left"}}>{cp.label}</span>
                          {activeCP===cp.id && <CheckCircle size={10} style={{color:"#22c55e"}}/>}
                        </button>
                      ))}
                    </div>
                    <button onClick={completeVisit} style={{width:"100%",background:"#fff",color:"#000",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:600,cursor:"pointer",border:"none",fontFamily:"Inter,sans-serif"}}>
                      Mark Complete ✓
                    </button>
                  </div>
                ) : (
                  <div className="au2 card" style={{padding:"24px 16px",textAlign:"center"}}>
                    <Navigation size={24} style={{color:"#3a2a5a",marginBottom:8}}/>
                    <p style={{fontSize:13,fontWeight:500,color:"#9d8cbb",margin:"0 0 4px"}}>No Active Visit</p>
                    <p style={{fontSize:12,color:"#6b5a88",margin:"0 0 16px"}}>Counsellor assigns you a visit, or start one yourself.</p>
                    <button onClick={()=>setShowSelfAssign(!showSelfAssign)}
                      style={{background:"rgba(124,58,237,.15)",border:"1px solid rgba(124,58,237,.3)",borderRadius:8,padding:"8px 16px",color:"#c4b5fd",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",display:"inline-flex",alignItems:"center",gap:6}}>
                      <Plus size={14}/> Start Visit Yourself
                    </button>

                    {showSelfAssign && (
                      <div style={{marginTop:14,textAlign:"left"}}>
                        <input style={{width:"100%",background:"#0a0810",border:"1px solid #1e1530",borderRadius:8,padding:"9px 12px",color:"#f0ecff",fontSize:13,fontFamily:"Inter,sans-serif",outline:"none",marginBottom:8,boxSizing:"border-box"}}
                          placeholder="Student name *" value={selfForm.studentName} onChange={e=>setSelfForm(f=>({...f,studentName:e.target.value}))}/>
                        <input style={{width:"100%",background:"#0a0810",border:"1px solid #1e1530",borderRadius:8,padding:"9px 12px",color:"#f0ecff",fontSize:13,fontFamily:"Inter,sans-serif",outline:"none",marginBottom:8,boxSizing:"border-box"}}
                          placeholder="Phone (optional)" value={selfForm.phone} onChange={e=>setSelfForm(f=>({...f,phone:e.target.value}))}/>
                        <select style={{width:"100%",background:"#0a0810",border:"1px solid #1e1530",borderRadius:8,padding:"9px 12px",color:"#f0ecff",fontSize:13,fontFamily:"Inter,sans-serif",outline:"none",marginBottom:12,boxSizing:"border-box",cursor:"pointer"}}
                          value={selfForm.course} onChange={e=>setSelfForm(f=>({...f,course:e.target.value}))}>
                          {COURSES.map(c=><option key={c}>{c}</option>)}
                        </select>
                        <button onClick={selfAssignVisit} disabled={selfSaving||!selfForm.studentName}
                          style={{width:"100%",background:selfForm.studentName?"#fff":"#1a1230",color:selfForm.studentName?"#000":"#6b5a88",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:600,cursor:selfForm.studentName?"pointer":"default",border:"none",fontFamily:"Inter,sans-serif"}}>
                          {selfSaving?"Starting...":"Start Visit →"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab==="visits" && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="au"><p style={{fontSize:18,fontWeight:600,color:"#fff",margin:0}}>My Visits</p></div>
                <div className="au1 card" style={{overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:"1px solid #141414"}}>
                    <p style={{fontSize:13,fontWeight:500,color:"#fff",margin:0}}>History <span style={{color:"#9d8cbb"}}>({myVisits.length})</span></p>
                  </div>
                  {myVisits.length===0 ? <p style={{padding:"20px 16px",color:"#6b5a88",fontSize:13,margin:0}}>No visits yet.</p>
                  : myVisits.map((v,i)=>(
                    <div key={i} className="row">
                      <div style={{flex:1}}>
                        <p style={{fontSize:13,fontWeight:500,color:"#f0ecff",margin:0}}>{v.studentName}</p>
                        <p style={{fontSize:11,color:"#9d8cbb",margin:0}}>{v.course}</p>
                      </div>
                      <Badge color={v.status==="completed"?"green":v.status==="in_progress"?"amber":"purple"}>{v.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="attendance" && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="au"><p style={{fontSize:18,fontWeight:600,color:"#fff",margin:0}}>Attendance</p></div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[
                    {l:"Total Visits", v:myVisits.length,             c:"#fff"},
                    {l:"Completed",    v:myVisits.filter((v:any)=>v.status==="completed").length, c:"#4ade80"},
                    {l:"Status",       v:profile?.isOnDuty?"ON":"OFF", c:profile?.isOnDuty?"#4ade80":"#555"},
                  ].map((s,i)=>(
                    <div key={i} className={`au${i+1} card`} style={{padding:"16px 14px"}}>
                      <p style={{fontSize:22,fontWeight:700,color:s.c,margin:"0 0 2px",letterSpacing:"-0.5px"}}>{s.v}</p>
                      <p style={{fontSize:11,color:"#9d8cbb",margin:0}}>{s.l}</p>
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
