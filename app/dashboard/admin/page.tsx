 "use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { Users, LogOut, Activity, Navigation, Shield, BarChart3, Clock, CheckCircle, ChevronRight } from "lucide-react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;}
body{margin:0;font-family:'Inter',sans-serif;}
.f{font-family:'Inter',sans-serif;}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
.au{animation:fadeUp .3s ease both;}
.au1{animation:fadeUp .3s ease .05s both;}
.au2{animation:fadeUp .3s ease .1s both;}
.au3{animation:fadeUp .3s ease .15s both;}
.dot{animation:pulse 2s ease infinite;}
.card{background:#111;border:1px solid #1f1f1f;border-radius:10px;transition:border-color .15s;}
.card:hover{border-color:#2a2a2a;}
.nav-item{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;cursor:pointer;border:none;background:none;width:100%;text-align:left;color:#8b7aaa;font-size:13px;font-family:'Inter',sans-serif;transition:all .15s;}
.nav-item:hover{background:rgba(124,58,237,.1);color:#c4b5fd;}
.nav-item.active{background:rgba(124,58,237,.18);color:#e0d0ff;}
.badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;font-family:'Inter',sans-serif;}
.btn{border:none;cursor:pointer;font-family:'Inter',sans-serif;font-weight:500;transition:all .15s;}
.row{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #141414;transition:background .15s;}
.row:hover{background:#0d0d0d;}
.row:last-child{border-bottom:none;}
.row:hover{background:rgba(124,58,237,.04);}
select{font-family:'Inter',sans-serif;outline:none;}
select:focus{border-color:#333!important;}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-thumb{background:#1f1f1f;border-radius:2px;}
`;

const NAV = [
  {id:"overview", icon:Activity,   label:"Overview"},
  {id:"users",    icon:Users,      label:"Users"},
  {id:"visits",   icon:Navigation, label:"Visits"},
  {id:"analytics",icon:BarChart3,  label:"Analytics"},
  {id:"attendance",icon:Clock,     label:"Attendance"},
];
const CP_LABELS:any = {zenith_office:"🏢 Zenith Office",a_block:"🏗️ A Block",d_block:"🏛️ D Block",dedicated_floor:"🔝 Dedicated Floor",reception:"🎪 Reception",library:"📚 Library",canteen:"🍽️ Canteen",hostel:"🏠 Hostel",off_campus:"🌍 Off Campus",cabin:"🪵 Cabin"};

const Av = ({name,size=28}:any) => {
  const i = name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase()||"?";
  return <div style={{width:size,height:size,borderRadius:"50%",background:"#1e1530",border:"1px solid #2a1f45",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:size>30?12:10,fontWeight:600,color:"#fff"}}>{i}</span></div>;
};

const Badge = ({children,color="purple"}:any) => {
  const c:any = {purple:{bg:"rgba(167,139,250,.12)",color:"#c4b5fd"},green:{bg:"rgba(34,197,94,.1)",color:"#4ade80"},amber:{bg:"rgba(245,158,11,.1)",color:"#fbbf24"},gray:{bg:"#1a1a1a",color:"#8b7aaa"}};
  return <span className="badge" style={{background:c[color]?.bg,color:c[color]?.color}}>{children}</span>;
};

const Stat = ({label,val,icon:Icon,accent="#7c3aed"}:any) => (
  <div className="card au1" style={{padding:"16px 18px"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <Icon size={14} style={{color:"#6b5a88"}}/>
      <ChevronRight size={12} style={{color:"#222"}}/>
    </div>
    <p style={{fontSize:22,fontWeight:700,color:"#fff",margin:"0 0 2px",letterSpacing:"-0.5px"}}>{val}</p>
    <p style={{fontSize:12,color:"#9d8cbb",margin:0}}>{label}</p>
  </div>
);

export default function AdminDashboard() {
  const {profile,loading} = useAuth();
  const router = useRouter();
  const [tab,setTab]     = useState("overview");
  const [users,setUsers] = useState<any[]>([]);
  const [visits,setVisits] = useState<any[]>([]);
  const [toast,setToast] = useState("");
  const [mob,setMob] = useState(false);

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  useEffect(()=>{ if(!loading&&!profile) router.push("/login"); if(!loading&&profile?.role!=="admin") router.push("/"); },[profile,loading]);
  useEffect(()=>{
    const u1=onValue(ref(db,"users"),s=>{ if(s.exists()) setUsers(Object.entries(s.val()).map(([uid,v]:any)=>({uid,...v}))); });
    const u2=onValue(ref(db,"visits"),s=>{ if(s.exists()) setVisits(Object.entries(s.val()).map(([id,v]:any)=>({id,...v}))); else setVisits([]); });
    return ()=>{ u1(); u2(); };
  },[]);

  const changeRole = async (uid:string,role:string) => {
    await update(ref(db,`users/${uid}`),{role});
    showToast("Role updated");
  };

  const interns=users.filter(u=>u.role==="intern");
  const counsellors=users.filter(u=>u.role==="counsellor");
  const onDuty=interns.filter(u=>u.isOnDuty);

  if(loading) return <div style={{background:"#08060f",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:"#6b5a88",fontFamily:"Inter,sans-serif",fontSize:13}}>Loading...</p></div>;

  return (
    <>
      <style>{CSS}</style>
      {toast && <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"#1a1230",border:"1px solid #2a1f45",borderRadius:8,padding:"10px 16px",color:"#fff",fontSize:12,zIndex:100,fontFamily:"Inter,sans-serif"}}>{toast}</div>}
      <div className="f" style={{display:"flex",minHeight:"100vh",background:"#08060f"}}>

        {/* Sidebar */}
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
                <p style={{fontSize:10,color:"#9d8cbb",margin:0}}>Admin</p>
              </div>
            </div>
            <button className="nav-item" onClick={async()=>{await logout();router.push("/login");}}>
              <LogOut size={14}/>Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <div style={{flex:1,marginLeft:0,display:"flex",flexDirection:"column"}}>
          <header style={{padding:"12px 16px",borderBottom:"1px solid #141414",position:"sticky",top:0,background:"#08060f",zIndex:30,display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setMob(!mob)} style={{background:"none",border:"none",cursor:"pointer",padding:4,color:"#8b7aaa",display:"flex",alignItems:"center"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <p style={{fontSize:13,fontWeight:500,color:"#b09fd0",margin:0,flex:1}}>{NAV.find(n=>n.id===tab)?.label}</p>
            <Badge color="gray">Admin</Badge>
          </header>

          <main style={{flex:1,padding:"24px",overflowY:"auto"}}>

            {tab==="overview" && (
              <div style={{display:"flex",flexDirection:"column",gap:20}}>
                <div className="au">
                  <p style={{fontSize:18,fontWeight:600,color:"#fff",margin:"0 0 2px"}}>Good morning, {profile?.name?.split(" ")[0]}</p>
                  <p style={{fontSize:13,color:"#9d8cbb",margin:0}}>Here's what's happening today</p>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  <Stat label="Interns"    val={interns.length}     icon={Users}/>
                  <Stat label="Counsellors" val={counsellors.length} icon={Shield}/>
                  <Stat label="On Duty"    val={onDuty.length}      icon={Activity}/>
                  <Stat label="Visits"     val={visits.length}      icon={Navigation}/>
                </div>
                <div className="au2 card" style={{overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:"1px solid #141414",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <p style={{fontSize:13,fontWeight:500,color:"#fff",margin:0}}>Live Intern Status</p>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div className="dot" style={{width:6,height:6,borderRadius:"50%",background:"#22c55e"}}/>
                      <span style={{fontSize:11,color:"#22c55e"}}>Live</span>
                    </div>
                  </div>
                  {interns.length===0 ? <p style={{padding:"20px 16px",color:"#6b5a88",fontSize:13,margin:0}}>No interns yet.</p>
                  : interns.map((u,i)=>(
                    <div key={i} className="row">
                      <Av name={u.name}/>
                      <div style={{flex:1}}>
                        <p style={{fontSize:13,fontWeight:500,color:"#f0ecff",margin:0}}>{u.name}</p>
                        <p style={{fontSize:11,color:"#9d8cbb",margin:0}}>{u.email}</p>
                      </div>
                      <Badge color={u.isOnDuty?"green":"gray"}>{u.isOnDuty?"On Duty":"Off"}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="users" && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="au"><p style={{fontSize:18,fontWeight:600,color:"#fff",margin:0}}>Users</p></div>
                <div className="au1 card" style={{overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:"1px solid #141414"}}>
                    <p style={{fontSize:13,fontWeight:500,color:"#fff",margin:0}}>All Users <span style={{color:"#9d8cbb"}}>({users.length})</span></p>
                  </div>
                  {users.map((u,i)=>(
                    <div key={i} className="row">
                      <Av name={u.name}/>
                      <div style={{flex:1}}>
                        <p style={{fontSize:13,fontWeight:500,color:"#f0ecff",margin:0}}>{u.name}</p>
                        <p style={{fontSize:11,color:"#9d8cbb",margin:0}}>{u.email}</p>
                      </div>
                      <select value={u.role} onChange={e=>changeRole(u.uid,e.target.value)}
                        style={{background:"#140f24",border:"1px solid #222",borderRadius:6,padding:"4px 8px",color:"#c4b5fd",fontSize:12,cursor:"pointer"}}>
                        <option value="intern">Intern</option>
                        <option value="counsellor">Counsellor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="visits" && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="au"><p style={{fontSize:18,fontWeight:600,color:"#fff",margin:0}}>All Visits</p></div>
                <div className="au1 card" style={{overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:"1px solid #141414"}}>
                    <p style={{fontSize:13,fontWeight:500,color:"#fff",margin:0}}>Visit Log <span style={{color:"#9d8cbb"}}>({visits.length})</span></p>
                  </div>
                  {visits.length===0 ? <p style={{padding:"20px 16px",color:"#6b5a88",fontSize:13,margin:0}}>No visits yet.</p>
                  : visits.map((v:any,i:number)=>(
                    <div key={i} className="row">
                      <div style={{flex:1}}>
                        <p style={{fontSize:13,fontWeight:500,color:"#f0ecff",margin:0}}>{v.studentName}</p>
                        <p style={{fontSize:11,color:"#9d8cbb",margin:0}}>{v.course} · {v.internName}</p>
                        {v.currentCheckpoint && v.status!=="completed" && (
                          <div style={{display:"flex",alignItems:"center",gap:4,marginTop:4}}>
                            <div style={{width:5,height:5,borderRadius:"50%",background:"#22c55e"}} className="dot"/>
                            <span style={{fontSize:11,color:"#22c55e"}}>Currently at: {CP_LABELS[v.currentCheckpoint]||v.currentCheckpoint}</span>
                          </div>
                        )}
                        {v.checkpoints?.length>0 && (
                          <p style={{fontSize:10,color:"#6b5a88",margin:"2px 0 0"}}>Route: {v.checkpoints.map((c:string)=>CP_LABELS[c]||c).join(" → ")}</p>
                        )}
                      </div>
                      <Badge color={v.status==="completed"?"green":v.status==="in_progress"?"amber":"purple"}>{v.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="analytics" && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="au"><p style={{fontSize:18,fontWeight:600,color:"#fff",margin:0}}>Analytics</p></div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  <Stat label="Total Visits"  val={visits.length}                                          icon={Navigation}/>
                  <Stat label="Completed"     val={visits.filter((v:any)=>v.status==="completed").length}  icon={CheckCircle}/>
                  <Stat label="In Progress"   val={visits.filter((v:any)=>v.status==="in_progress").length} icon={Activity}/>
                  <Stat label="On Duty"       val={onDuty.length}                                          icon={Users}/>
                </div>
              </div>
            )}

            {tab==="attendance" && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="au"><p style={{fontSize:18,fontWeight:600,color:"#fff",margin:0}}>Attendance</p></div>
                <div className="au1 card" style={{overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:"1px solid #141414"}}>
                    <p style={{fontSize:13,fontWeight:500,color:"#fff",margin:0}}>Intern Duty Status</p>
                  </div>
                  {interns.map((u,i)=>(
                    <div key={i} className="row">
                      <div style={{width:6,height:6,borderRadius:"50%",background:u.isOnDuty?"#22c55e":"#222",flexShrink:0}}/>
                      <Av name={u.name}/>
                      <div style={{flex:1}}>
                        <p style={{fontSize:13,fontWeight:500,color:"#f0ecff",margin:0}}>{u.name}</p>
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
