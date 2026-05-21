"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";
import {
  Users, Star, Bell, LogOut, Activity, TrendingUp,
  Navigation, Shield, User, Zap, Menu, X,
  ArrowUpRight, BarChart3, Clock, CheckCircle
} from "lucide-react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
*,*::before,*::after{box-sizing:border-box;}
body{margin:0;}
.f-syne{font-family:'Syne',sans-serif!important;}
.f-dm{font-family:'DM Sans',sans-serif!important;}
@keyframes floatA{0%,100%{transform:translate(0,0) scale(1);}40%{transform:translate(40px,-40px) scale(1.06);}70%{transform:translate(-25px,25px) scale(0.94);}}
@keyframes floatB{0%,100%{transform:translate(0,0);}50%{transform:translate(-30px,-20px);}}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse2{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.5);opacity:.5;}}
@keyframes toastIn{from{opacity:0;transform:translateX(110px) scale(.95);}to{opacity:1;transform:translateX(0) scale(1);}}
@keyframes barGrow{from{width:0;}}
.orb1{animation:floatA 14s ease-in-out infinite;}
.orb2{animation:floatB 18s ease-in-out infinite reverse;}
.au{animation:fadeUp .55s cubic-bezier(.16,1,.3,1) both;}
.au1{animation:fadeUp .55s cubic-bezier(.16,1,.3,1) .08s both;}
.au2{animation:fadeUp .55s cubic-bezier(.16,1,.3,1) .16s both;}
.au3{animation:fadeUp .55s cubic-bezier(.16,1,.3,1) .24s both;}
.live-dot{animation:pulse2 1.6s ease-in-out infinite;}
.toast-in{animation:toastIn .42s cubic-bezier(.16,1,.3,1) both;}
.glass{background:rgba(255,255,255,.04);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,.07);}
.glass-hi:hover{background:rgba(255,255,255,.06)!important;border-color:rgba(139,92,246,.22)!important;transition:all .22s;}
.glow-v{box-shadow:0 0 44px rgba(124,58,237,.38),0 0 90px rgba(124,58,237,.14);}
.cshadow{box-shadow:0 6px 36px rgba(0,0,0,.45),0 1px 0 rgba(255,255,255,.04) inset;}
.grad-text{background:linear-gradient(135deg,#c4b5fd 0%,#8b5cf6 50%,#6d28d9 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.btn-v{background:linear-gradient(135deg,#7c3aed,#6d28d9);transition:all .2s;border:none;cursor:pointer;color:white;}
.btn-v:hover{background:linear-gradient(135deg,#8b5cf6,#7c3aed);transform:translateY(-1px);box-shadow:0 10px 28px rgba(124,58,237,.42);}
.nav-it{transition:all .18s;cursor:pointer;border:none;background:none;width:100%;text-align:left;}
.nav-it:hover{background:rgba(139,92,246,.1);border-radius:.75rem;}
.nav-it.on{background:rgba(124,58,237,.2);border-radius:.75rem;border-left:2px solid #8b5cf6;}
.sc-hover{transition:all .28s cubic-bezier(.16,1,.3,1);}
.sc-hover:hover{transform:translateY(-4px);box-shadow:0 16px 44px rgba(124,58,237,.22);}
.bar-anim{animation:barGrow .8s cubic-bezier(.16,1,.3,1) both;}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(139,92,246,.35);border-radius:2px;}
input,select{outline:none!important;font-family:'DM Sans',sans-serif;}
input:focus,select:focus{border-color:rgba(139,92,246,.55)!important;box-shadow:0 0 0 3px rgba(139,92,246,.1)!important;}
table{border-collapse:collapse;width:100%;}
`;

const NAV = [
  { id:"overview",    icon:Activity,    label:"Overview"    },
  { id:"users",       icon:Users,       label:"Users"       },
  { id:"visits",      icon:Navigation,  label:"All Visits"  },
  { id:"analytics",   icon:BarChart3,   label:"Analytics"   },
  { id:"attendance",  icon:Clock,       label:"Attendance"  },
];

const Av = ({ name, sz="md" }: any) => {
  const init = name ? name.split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase() : "?";
  const s = sz==="sm" ? 28 : 36;
  return (
    <div style={{width:s,height:s,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#4f46e5)",
      display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <span className="f-syne" style={{fontSize:sz==="sm"?10:12,fontWeight:700,color:"white"}}>{init}</span>
    </div>
  );
};

const Badge = ({ children, v="violet" }: any) => {
  const colors: any = {
    violet:{bg:"rgba(124,58,237,.18)",color:"#a78bfa"},
    green:{bg:"rgba(34,197,94,.15)",color:"#4ade80"},
    amber:{bg:"rgba(245,158,11,.15)",color:"#fbbf24"},
    red:{bg:"rgba(239,68,68,.15)",color:"#f87171"},
  };
  const c = colors[v]||colors.violet;
  return (
    <span className="f-syne" style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,
      background:c.bg,color:c.color,letterSpacing:.4}}>{children}</span>
  );
};

const Stat = ({ label, val, Icon, c="v" }: any) => {
  const colors: any = {v:"#7c3aed",b:"#2563eb",g:"#16a34a",amb:"#d97706"};
  return (
    <div className="glass cshadow sc-hover" style={{borderRadius:18,padding:"18px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div style={{width:36,height:36,borderRadius:12,background:`rgba(${c==="v"?"124,58,237":c==="b"?"37,99,235":c==="g"?"22,163,74":"217,119,6"},.18)`,
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon size={16} style={{color:colors[c]}} />
        </div>
        <ArrowUpRight size={14} style={{color:"#374151"}} />
      </div>
      <p className="f-syne" style={{fontSize:20,fontWeight:700,color:"#f8f8ff",margin:"0 0 2px"}}>{val}</p>
      <p className="f-dm"   style={{fontSize:11,color:"#6b7280",margin:0}}>{label}</p>
    </div>
  );
};

export default function AdminDashboard() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab]       = useState("overview");
  const [mob, setMob]       = useState(false);
  const [users, setUsers]   = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [toasts, setToasts] = useState<any[]>([]);

  const toast = useCallback((type: string, title: string, msg: string) => {
    const id = Date.now();
    setToasts(t=>[...t,{id,type,title,msg}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4000);
  },[]);

  useEffect(()=>{
    if(!loading && !profile) router.push("/login");
    if(!loading && profile?.role !== "admin") router.push("/");
  },[profile,loading]);

  useEffect(()=>{
    const unsub1 = onValue(ref(db,"users"),(snap)=>{
      if(snap.exists()) setUsers(Object.values(snap.val()));
    });
    const unsub2 = onValue(ref(db,"visits"),(snap)=>{
      if(snap.exists()) setVisits(Object.values(snap.val()));
      else setVisits([]);
    });
    return ()=>{ unsub1(); unsub2(); };
  },[]);

  const handleLogout = async () => { await logout(); router.push("/login"); };

  const changeRole = async (uid: string, newRole: string) => {
    await update(ref(db,`users/${uid}`),{role:newRole});
    toast("success","Role Updated","User role changed successfully.");
  };

  const interns    = users.filter(u=>u.role==="intern");
  const counsellors = users.filter(u=>u.role==="counsellor");
  const onDuty     = interns.filter(u=>u.isOnDuty);

  if(loading) return <div style={{background:"#07070f",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:"#6b7280",fontFamily:"sans-serif"}}>Loading...</p></div>;

  return (
    <>
      <style>{CSS}</style>
      <div className="f-dm" style={{display:"flex",minHeight:"100vh",background:"#07070f"}}>

        {/* Toasts */}
        <div style={{position:"fixed",top:20,right:20,zIndex:100,display:"flex",flexDirection:"column",gap:8}}>
          {toasts.map(t=>(
            <div key={t.id} className="toast-in glass cshadow" style={{borderRadius:14,padding:"12px 16px",minWidth:260,borderLeft:`3px solid ${t.type==="success"?"#22c55e":"#7c3aed"}`}}>
              <p className="f-syne" style={{fontSize:13,fontWeight:700,color:"#f8f8ff",margin:"0 0 2px"}}>{t.title}</p>
              <p className="f-dm"   style={{fontSize:12,color:"#6b7280",margin:0}}>{t.msg}</p>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        {mob && <div onClick={()=>setMob(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:40}} />}
        <aside className="glass" style={{
          width:220,flexShrink:0,display:"flex",flexDirection:"column",padding:"20px 12px",
          borderRight:"1px solid rgba(255,255,255,.06)",position:"fixed",top:0,left:0,height:"100vh",zIndex:50,
          transform:mob?"translateX(0)":"translateX(0)",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",marginBottom:24}}>
            <div className="glow-v" style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#7c3aed,#4f46e5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Zap size={16} style={{color:"white"}} />
            </div>
            <div>
              <p className="f-syne grad-text" style={{fontSize:12,fontWeight:700,margin:0}}>CampusFlow</p>
              <p className="f-dm" style={{fontSize:10,color:"#374151",margin:0}}>Admin Portal</p>
            </div>
          </div>
          <nav style={{flex:1,display:"flex",flexDirection:"column",gap:4}}>
            {NAV.map(n=>(
              <button key={n.id} className={`nav-it${tab===n.id?" on":""}`}
                onClick={()=>{setTab(n.id);setMob(false);}}
                style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:10,color:tab===n.id?"#c4b5fd":"#4b5563"}}>
                <n.icon size={15} /><span className="f-dm" style={{fontSize:13,fontWeight:500}}>{n.label}</span>
              </button>
            ))}
          </nav>
          <button onClick={handleLogout} className="nav-it" style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:10,color:"#4b5563"}}>
            <LogOut size={15}/><span className="f-dm" style={{fontSize:13}}>Logout</span>
          </button>
        </aside>

        {/* Main */}
        <div style={{flex:1,marginLeft:220,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
          <header className="glass" style={{padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.06)",position:"sticky",top:0,zIndex:30,background:"rgba(7,7,15,.88)"}}>
            <div>
              <p className="f-syne" style={{fontSize:13,fontWeight:600,color:"#f8f8ff",margin:0}}>Admin Portal</p>
              <p className="f-dm"   style={{fontSize:11,color:"#374151",margin:0}}>Zenith CampusFlow</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div className="glass glass-hi" style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",borderRadius:12,cursor:"pointer"}}>
                <Av name={profile?.name} sz="sm"/>
                <span className="f-dm" style={{fontSize:12,color:"#d1d5db"}}>{profile?.name}</span>
              </div>
            </div>
          </header>

          <main style={{flex:1,overflowY:"auto",padding:"28px 24px",background:"radial-gradient(ellipse 700px 400px at 65% 8%,rgba(109,40,217,.06) 0%,transparent 55%),#07070f"}}>

            {tab==="overview" && (
              <div style={{display:"flex",flexDirection:"column",gap:24}}>
                <h1 className="f-syne au" style={{fontSize:18,fontWeight:700,color:"#f8f8ff",margin:0}}>
                  Good morning, <span className="grad-text">{profile?.name?.split(" ")[0]}</span> 👋
                </h1>
                <div className="au1" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14}}>
                  <Stat label="Total Interns"    val={interns.length}     Icon={Users}      c="v" />
                  <Stat label="Counsellors"      val={counsellors.length} Icon={Shield}     c="b" />
                  <Stat label="On Duty Now"      val={onDuty.length}      Icon={Activity}   c="g" />
                  <Stat label="Total Visits"     val={visits.length}      Icon={Navigation} c="amb" />
                </div>

                <div className="au2 glass cshadow" style={{borderRadius:18,overflow:"hidden"}}>
                  <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span className="f-syne" style={{fontSize:12,fontWeight:600,color:"#f8f8ff"}}>Live Intern Status</span>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div className="live-dot" style={{width:7,height:7,borderRadius:"50%",background:"#22c55e"}}/>
                      <span className="f-dm" style={{fontSize:11,color:"#22c55e"}}>Live</span>
                    </div>
                  </div>
                  {interns.length === 0 ? (
                    <div style={{padding:"32px 20px",textAlign:"center"}}>
                      <p className="f-dm" style={{color:"#374151",fontSize:13}}>No interns yet. Add users from the Users tab.</p>
                    </div>
                  ) : interns.map((intern,i)=>(
                    <div key={i} className="glass-hi" style={{padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,.04)",display:"flex",alignItems:"center",gap:12}}>
                      <Av name={intern.name} sz="sm"/>
                      <div style={{flex:1}}>
                        <p className="f-syne" style={{fontSize:13,fontWeight:600,color:"#f8f8ff",margin:0}}>{intern.name}</p>
                        <p className="f-dm"   style={{fontSize:11,color:"#4b5563",margin:0}}>{intern.email}</p>
                      </div>
                      <Badge v={intern.isOnDuty?"green":"violet"}>{intern.isOnDuty?"On Duty":"Off Duty"}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="users" && (
              <div style={{display:"flex",flexDirection:"column",gap:24}}>
                <h1 className="f-syne au" style={{fontSize:18,fontWeight:700,color:"#f8f8ff",margin:0}}>User Management</h1>
                <div className="au1 glass cshadow" style={{borderRadius:18,overflow:"hidden"}}>
                  <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                    <span className="f-syne" style={{fontSize:12,fontWeight:600,color:"#f8f8ff"}}>All Users ({users.length})</span>
                  </div>
                  {users.length===0 ? (
                    <div style={{padding:"32px 20px",textAlign:"center"}}>
                      <p className="f-dm" style={{color:"#374151",fontSize:13}}>No users yet.</p>
                    </div>
                  ) : users.map((u,i)=>(
                    <div key={i} className="glass-hi" style={{padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,.04)",display:"flex",alignItems:"center",gap:12}}>
                      <Av name={u.name} sz="sm"/>
                      <div style={{flex:1}}>
                        <p className="f-syne" style={{fontSize:13,fontWeight:600,color:"#f8f8ff",margin:0}}>{u.name}</p>
                        <p className="f-dm"   style={{fontSize:11,color:"#4b5563",margin:0}}>{u.email}</p>
                      </div>
                      <select value={u.role} onChange={e=>changeRole(u.uid,e.target.value)}
                        style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 10px",color:"#c4b5fd",fontSize:12,cursor:"pointer"}}>
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
              <div style={{display:"flex",flexDirection:"column",gap:24}}>
                <h1 className="f-syne au" style={{fontSize:18,fontWeight:700,color:"#f8f8ff",margin:0}}>All Visits</h1>
                <div className="au1 glass cshadow" style={{borderRadius:18,overflow:"hidden"}}>
                  <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                    <span className="f-syne" style={{fontSize:12,fontWeight:600,color:"#f8f8ff"}}>Visit Log ({visits.length})</span>
                  </div>
                  {visits.length===0 ? (
                    <div style={{padding:"32px 20px",textAlign:"center"}}>
                      <p className="f-dm" style={{color:"#374151",fontSize:13}}>No visits yet.</p>
                    </div>
                  ) : visits.map((v:any,i:number)=>(
                    <div key={i} className="glass-hi" style={{padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,.04)",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{flex:1}}>
                        <p className="f-syne" style={{fontSize:13,fontWeight:600,color:"#f8f8ff",margin:0}}>{v.studentName}</p>
                        <p className="f-dm"   style={{fontSize:11,color:"#4b5563",margin:0}}>{v.course} · {v.internName}</p>
                      </div>
                      <Badge v={v.status==="completed"?"green":v.status==="in_progress"?"amber":"violet"}>
                        {v.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="analytics" && (
              <div style={{display:"flex",flexDirection:"column",gap:24}}>
                <h1 className="f-syne au" style={{fontSize:18,fontWeight:700,color:"#f8f8ff",margin:0}}>Analytics</h1>
                <div className="au1" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14}}>
                  <Stat label="Total Visits"    val={visits.length}                                       Icon={Navigation} c="v" />
                  <Stat label="Completed"       val={visits.filter((v:any)=>v.status==="completed").length} Icon={CheckCircle} c="g" />
                  <Stat label="In Progress"     val={visits.filter((v:any)=>v.status==="in_progress").length} Icon={Activity} c="amb" />
                  <Stat label="Active Interns"  val={onDuty.length}                                       Icon={Users}      c="b" />
                </div>
              </div>
            )}

            {tab==="attendance" && (
              <div style={{display:"flex",flexDirection:"column",gap:24}}>
                <h1 className="f-syne au" style={{fontSize:18,fontWeight:700,color:"#f8f8ff",margin:0}}>Attendance</h1>
                <div className="au1 glass cshadow" style={{borderRadius:18,overflow:"hidden"}}>
                  <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                    <span className="f-syne" style={{fontSize:12,fontWeight:600,color:"#f8f8ff"}}>Intern Duty Status</span>
                  </div>
                  {interns.map((intern,i)=>(
                    <div key={i} className="glass-hi" style={{padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,.04)",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:intern.isOnDuty?"#22c55e":"#374151",flexShrink:0}}/>
                      <Av name={intern.name} sz="sm"/>
                      <div style={{flex:1}}>
                        <p className="f-syne" style={{fontSize:13,fontWeight:600,color:"#f8f8ff",margin:0}}>{intern.name}</p>
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