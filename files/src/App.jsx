import { useState, useMemo, useEffect, Fragment } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE = "https://temco-backend-production.up.railway.app";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
// Light, premium theme with a single confident orange accent — used consistently
// across the marketing pages, all forms, and the Admin/Worker/Customer dashboards.
const C = {
  navy: "#FAFAF9", navyMid: "#FFFFFF", navyLight: "#F6F4EF",
  amber: "#FF5A1F", amberDim: "#E0450F",
  green: "#16A34A", red: "#DC2626", blue: "#2563EB",
  chalk: "#1A1D23", muted: "#5B6270", grayLight: "#9CA3AF", border: "#E7E7E5",
};

const SKILL_TYPES = ["Loading","Unloading","Packing","Inventory","Assembly","Class A Driver","Crew Lead","Driving","Shuttle","Crating","Delivery"];
const BASE_RATES_PREVIEW = { "Load/Unload":85, "Inventory":85, "Packing":90, "Assembly":90, "Driving":110, "Full Service":110 };
function previewDispatchFee({ work_type, crew, date, same_day, specialty_item }) {
  const base = BASE_RATES_PREVIEW[work_type] || 100;
  let perWorker = base;
  const today = new Date(); today.setHours(0,0,0,0);
  const reqDate = date ? new Date(date) : null;
  const isSameDay = same_day || (reqDate && (reqDate - today) <= 86400000 && (reqDate - today) >= 0);
  if (isSameDay) perWorker += 15;
  let total = perWorker * (parseInt(crew) || 0);
  if (specialty_item) total += 75;
  return total;
}

// Minimum notice required for a request — currently booking 48+ hours out while
// dispatch is monitored manually. Returns the earliest bookable date as YYYY-MM-DD.
const MIN_NOTICE_HOURS = 48;
function getMinBookableDate() {
  const min = new Date();
  min.setHours(min.getHours() + MIN_NOTICE_HOURS);
  return min.toISOString().slice(0, 10);
}
function isDateTooSoon(dateStr) {
  if (!dateStr) return false;
  const min = new Date();
  min.setHours(min.getHours() + MIN_NOTICE_HOURS);
  min.setHours(0,0,0,0);
  const chosen = new Date(dateStr);
  chosen.setHours(0,0,0,0);
  return chosen < min;
}
const TEMP_OPTIONS = ["New","Warming Up","Reliable","Went Quiet"];
const TEMP_COLORS = {
  "New": { bg:"#EFF6FF", color:"#2563EB" },
  "Warming Up": { bg:"#FFF3E6", color:"#C2410C" },
  "Reliable": { bg:"#E9F9EF", color:"#16A34A" },
  "Went Quiet": { bg:"#FDECEA", color:"#DC2626" },
};

const FALLBACK_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const field = {
  width:"100%", background:C.navyMid, border:`1px solid ${C.border}`,
  borderRadius:8, padding:"11px 14px", color:C.chalk, fontSize:14,
  outline:"none", boxSizing:"border-box", fontFamily:"inherit"
};
const label = { fontSize:11, color:C.muted, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:5, display:"block" };
const btn = (variant="primary") => ({
  background: variant==="primary" ? C.amber : variant==="ghost" ? "transparent" : C.navyLight,
  color: C.chalk,
  border: variant==="ghost" ? `1px solid ${C.border}` : "none",
  padding:"10px 20px", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer"
});

function Badge({ status }) {
  const map = {
    Available:{bg:"#E9F9EF",color:C.green}, Pending:{bg:"#EFF6FF",color:C.blue}, pending:{bg:"#EFF6FF",color:C.blue},
    "On Job":{bg:"#E9F9EF",color:"#15803D"}, Unavailable:{bg:"#FDECEA",color:C.red},
    Confirmed:{bg:"#E9F9EF",color:C.green}, "In Progress":{bg:"#FFF3E6",color:C.amberDim},
    Completed:{bg:"#F3F4F6",color:C.muted}, Active:{bg:"#E9F9EF",color:C.green}, active:{bg:"#E9F9EF",color:C.green},
    Cancelled:{bg:"#FDECEA",color:C.red}, Dispatching:{bg:"#FFF3E6",color:C.amberDim},
  };
  const s = map[status] || {bg:"#F3F4F6",color:C.muted};
  return <span style={{background:s.bg,color:s.color,padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase"}}>{status}</span>;
}

function StatCard({ label:lbl, value, sub, color }) {
  return (
    <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 24px",flex:1,minWidth:130}}>
      <div style={{fontSize:26,fontWeight:900,color:color||C.chalk}}>{value}</div>
      <div style={{fontSize:12,color:C.muted,marginTop:2}}>{lbl}</div>
      {sub && <div style={{fontSize:11,color:C.amber,marginTop:5,fontWeight:600}}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{marginBottom:24}}>
      <div style={{fontSize:22,fontWeight:800,color:C.chalk}}>{title}</div>
      {sub && <div style={{fontSize:13,color:C.muted,marginTop:4}}>{sub}</div>}
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{display:"flex",gap:6,marginBottom:26,background:C.navyMid,padding:5,borderRadius:10,width:"fit-content",flexWrap:"wrap"}}>
      {tabs.map(([k,l]) => (
        <button key={k} onClick={()=>onChange(k)} style={{
          padding:"7px 16px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",
          background:active===k?C.amber:"transparent",color:active===k?C.chalk:C.muted
        }}>{l}</button>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 0",color:C.muted,fontSize:13}}>
      <div style={{width:16,height:16,border:`2px solid ${C.border}`,borderTopColor:C.amber,borderRadius:"50%",marginRight:10,animation:"spin 0.8s linear infinite"}}/>
      Loading live data...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function exportToCSV(filename, rows, columns) {
  const escapeCell = (val) => {
    const s = (val === null || val === undefined) ? "" : String(val);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map(([h]) => escapeCell(h)).join(",");
  const body = rows.map(row => columns.map(([, accessor]) => escapeCell(accessor(row))).join(",")).join("\n");
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── PUBLIC HOME ──────────────────────────────────────────────────────────────
function PublicHome({ onNav, workerCount, stateCount }) {
  return (
    <div>
      {/* HERO */}
      <div style={{background:C.navy,padding:"96px 56px 0"}}>
        <div style={{maxWidth:820,margin:"0 auto",textAlign:"center"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"#FFF0E9",color:C.amberDim,fontSize:13.5,fontWeight:700,padding:"8px 18px",borderRadius:20,marginBottom:32}}>
            Built for moving companies, brokers, and carriers nationwide
          </div>
          <h1 style={{fontFamily:"'Inter',sans-serif",fontSize:"clamp(40px,5vw,58px)",fontWeight:900,lineHeight:1.08,letterSpacing:"-0.02em",color:C.chalk,margin:"0 0 24px"}}>
            A confirmed moving crew,<br/><span style={{color:C.amber}}>in minutes — not days.</span>
          </h1>
          <p style={{fontSize:18,color:C.muted,lineHeight:1.6,maxWidth:580,margin:"0 auto 40px"}}>
            TEMCO matches your job with vetted, local moving labor across all {stateCount} states — no cold calls, no group chats, no guesswork. Just a confirmed crew, fast.
          </p>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,marginBottom:72}}>
            <button onClick={()=>onNav("request")} style={{background:C.amber,color:C.chalk,fontSize:17,fontWeight:800,padding:"18px 44px",border:"none",borderRadius:10,cursor:"pointer",boxShadow:"0 8px 24px rgba(255,90,31,0.28)"}}>Request Your Crew Now →</button>
            <div style={{fontSize:13.5,color:C.muted,fontWeight:500}}>No crew confirmed, <strong style={{color:C.chalk}}>no charge</strong> — average match time under 10 minutes.</div>
          </div>
        </div>
      </div>

      {/* SOCIAL PROOF — light, high-contrast strip */}
      <div style={{background:C.navyMid,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:"36px 56px",display:"flex",justifyContent:"center",flexWrap:"wrap"}}>
        {[[`${workerCount}+`,"Active workers"],[`${stateCount}`,"States covered"],["97%","Fill rate"],["<10 min","Avg. match time"]].map(([num,label],i,arr)=>(
          <div key={label} style={{textAlign:"center",padding:"0 44px",borderRight:i<arr.length-1?`1px solid ${C.border}`:"none"}}>
            <div style={{fontSize:28,fontWeight:800,color:C.chalk}}>{num}</div>
            <div style={{fontSize:12.5,color:C.grayLight,marginTop:5,fontWeight:500}}>{label}</div>
          </div>
        ))}
      </div>

      {/* GUARANTEE STRIP */}
      <div style={{background:C.navyLight,padding:"22px 56px",display:"flex",justifyContent:"center",gap:48,flexWrap:"wrap"}}>
        {["No membership or setup fee","Pay only when your crew is confirmed","Workers paid on-site — no payroll to manage"].map(t=>(
          <div key={t} style={{display:"flex",alignItems:"center",gap:10,fontSize:14,fontWeight:600,color:C.chalk}}>
            <span style={{width:20,height:20,background:C.navyMid,color:C.green,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,flexShrink:0,boxShadow:`0 0 0 1.5px ${C.green} inset`}}>✓</span>
            {t}
          </div>
        ))}
      </div>

      {/* HOW IT WORKS — clean, no demo card */}
      <div style={{maxWidth:920,margin:"0 auto",padding:"110px 56px",textAlign:"center"}}>
        <div style={{fontSize:13,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:C.amber,marginBottom:14}}>How it works</div>
        <h2 style={{fontSize:34,fontWeight:800,letterSpacing:"-0.015em",marginBottom:16,lineHeight:1.18,color:C.chalk}}>From request to confirmed crew, in three steps.</h2>
        <p style={{fontSize:16,color:C.muted,lineHeight:1.6,maxWidth:520,margin:"0 auto 64px"}}>Submit your job details and TEMCO's matching system contacts vetted workers near your site immediately.</p>
        <div className="temco-grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:40,textAlign:"left"}}>
          {[
            ["01","Submit your job","Location, date, crew size, and the type of work you need."],
            ["02","We dispatch instantly","Nearby vetted workers are contacted within seconds."],
            ["03","Crew confirms","You get names and numbers the moment they're locked in."],
          ].map(([n,t,d])=>(
            <div key={n}>
              <div style={{fontSize:15,fontWeight:800,color:C.amber,marginBottom:14}}>{n}</div>
              <div style={{fontSize:17,fontWeight:700,color:C.chalk,marginBottom:8}}>{t}</div>
              <div style={{fontSize:14,color:C.muted,lineHeight:1.6}}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* VALUE PROPS */}
      <div style={{background:C.navyLight,padding:"100px 56px"}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <h2 style={{fontSize:33,fontWeight:800,letterSpacing:"-0.015em",color:C.chalk}}>Built for the pressure you're already under</h2>
          </div>
          <div className="temco-grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24}}>
            {[
              ["0","Payroll headaches","Workers are paid directly on-site. You never touch payroll, tax forms, or worker comp."],
              ["1","Flat dispatch fee","One transparent fee per job — no surprise charges, no long-term contracts."],
              [`${stateCount}`,"States, one platform","Stop rebuilding your labor network every time a job takes you somewhere new."],
            ].map(([num,title,desc])=>(
              <div key={title} style={{background:C.navyMid,borderRadius:14,padding:32,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:36,fontWeight:900,color:C.amber,marginBottom:10,lineHeight:1}}>{num}</div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:10,color:C.chalk}}>{title}</div>
                <div style={{fontSize:13.5,color:C.muted,lineHeight:1.6}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOR WORKERS */}
      <div style={{padding:"100px 56px",background:C.navy}}>
        <div style={{maxWidth:1120,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"center"}} className="temco-grid-2">
          <div>
            <div style={{fontSize:13,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:C.amber,marginBottom:14}}>For workers</div>
            <h2 style={{fontSize:33,fontWeight:800,letterSpacing:"-0.015em",color:C.chalk,marginBottom:18,lineHeight:1.2}}>Get paid moving jobs texted straight to your phone.</h2>
            <p style={{fontSize:15.5,color:C.muted,lineHeight:1.65,marginBottom:28,maxWidth:440}}>
              No app to download, no membership fees. Join the TEMCO network, get matched with jobs near you, and get paid directly on-site — every time.
            </p>
            <button onClick={()=>onNav("worker-signup")} style={{background:C.chalk,color:C.navyMid,fontSize:16,fontWeight:800,padding:"16px 32px",border:"none",borderRadius:10,cursor:"pointer"}}>Become a Helper →</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {[
              ["Get offers by text","No app needed — job offers come straight to your phone."],
              ["Reply YES or NO","Accept or decline with a single word. You're always in control."],
              ["Get paid on-site","The customer pays you directly — TEMCO never touches your pay."],
            ].map(([t,d])=>(
              <div key={t} style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 22px"}}>
                <div style={{fontSize:15,fontWeight:700,color:C.chalk,marginBottom:4}}>{t}</div>
                <div style={{fontSize:13.5,color:C.muted,lineHeight:1.5}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FINAL CTA — light, not dark */}
      <div style={{background:C.navyMid,padding:"110px 56px",textAlign:"center",borderTop:`1px solid ${C.border}`}}>
        <div style={{maxWidth:560,margin:"0 auto"}}>
          <h2 style={{color:C.chalk,fontSize:36,fontWeight:800,letterSpacing:"-0.015em",marginBottom:16,lineHeight:1.2}}>Your next job doesn't wait. Neither should your crew.</h2>
          <p style={{color:C.muted,fontSize:16,marginBottom:36,lineHeight:1.5}}>Submit a request now and get matched with vetted labor near your job site.</p>
          <button onClick={()=>onNav("request")} style={{background:C.amber,color:C.chalk,fontSize:17,fontWeight:800,padding:"18px 44px",border:"none",borderRadius:10,cursor:"pointer",boxShadow:"0 8px 24px rgba(255,90,31,0.28)"}}>Request Your Crew Now →</button>
        </div>
      </div>

      {/* Footer legal links, preserved from original */}
      <div style={{padding:"36px 56px",textAlign:"center",color:C.grayLight,fontSize:12.5,background:C.navy,borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap",marginBottom:12}}>
          <span style={{cursor:"pointer",color:C.muted}} onClick={()=>onNav("terms")}>Terms of Service</span>
          <span style={{cursor:"pointer",color:C.muted}} onClick={()=>onNav("privacy")}>Privacy Policy</span>
          <span style={{cursor:"pointer",color:C.muted}} onClick={()=>onNav("worker-agreement")}>Worker Agreement</span>
        </div>
        The Empire Moving Co., LLC d/b/a TEMCO National Labor Dispatch Network. All rights reserved.
      </div>
    </div>
  );
}

// ─── REQUEST FORM ─────────────────────────────────────────────────────────────
function RequestForm({ onNav, onAuth, states }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({company:"",contact:"",phone:"",email:"",password:"",location:"",state:"",zip:"",date:"",time:"",crew:"4",type:"Load/Unload",duration:"4",notes:"",same_day:false,specialty_item:false});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdJob, setCreatedJob] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const up = (k,v) => setForm(p=>({...p,[k]:v}));

  const handlePayment = async () => {
    setPayLoading(true);
    setPayError("");
    try {
      const res = await fetch(`${API_BASE}/api/payments/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
        body: JSON.stringify({ jobId: createdJob.id })
      });
      if (!res.ok) throw new Error("Payment session failed");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPayError("Could not create payment session. Please try again.");
      }
    } catch (e) {
      setPayError("Could not reach the payment server. Please try again.");
    } finally {
      setPayLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.password || form.password.length < 6) {
      setSubmitError("Please enter a password of at least 6 characters — this creates your account so you can track this job later.");
      return;
    }
    if (isDateTooSoon(form.date)) {
      setSubmitError(`We're currently booking jobs at least ${MIN_NOTICE_HOURS} hours in advance. For urgent same-day needs, please text us directly at (347) 835-4479.`);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      let token;
      const registerRes = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company:form.company, contact_name:form.contact, phone:form.phone, email:form.email, password:form.password }),
      });

      if (registerRes.status === 409) {
        const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        if (!loginRes.ok) {
          setSubmitError("An account already exists for this email. Enter the matching password, or use a different email.");
          setSubmitting(false);
          return;
        }
        token = (await loginRes.json()).token;
        onAuth(token);
        setAuthToken(token);
      } else if (!registerRes.ok) {
        setSubmitError("Could not create your account. Please check your details and try again.");
        setSubmitting(false);
        return;
      } else {
        token = (await registerRes.json()).token;
        onAuth(token);
        setAuthToken(token);
      }

      const jobRes = await fetch(`${API_BASE}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          location_city: form.location,
          location_state: form.state,
          location_zip: form.zip,
          job_date: form.date,
          job_time: form.time,
          crew_size: parseInt(form.crew),
          work_type: form.type,
          duration_hours: parseInt(form.duration),
          special_notes: form.notes,
          same_day: form.same_day,
          specialty_item: form.specialty_item,
        }),
      });
      if (!jobRes.ok) {
        setSubmitError("Your account was created, but the job request couldn't be submitted. Please try again.");
        setSubmitting(false);
        return;
      }
      const jobData = await jobRes.json();
      setCreatedJob(jobData.job);
      setSubmitted(true);
    } catch (e) {
      setSubmitError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && createdJob) {
    return (
      <div style={{padding:"60px 40px",maxWidth:540,margin:"0 auto",textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:14}}>✅</div>
        <h2 style={{fontSize:24,fontWeight:800,color:C.chalk,marginBottom:8}}>Request Submitted</h2>
        <p style={{color:C.muted,marginBottom:28}}>Your request has been received and saved. We'll follow up to confirm your crew.</p>
        <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22,marginBottom:24,textAlign:"left"}}>
          {[[`Job #`,createdJob.job_number],[`Location`,`${createdJob.location_city}, ${createdJob.location_state}`],[`Date`,createdJob.job_date ? createdJob.job_date.slice(0,10) : '—'],[`Time`,createdJob.job_time ? createdJob.job_time.slice(0,5) : '—'],[`Crew`,`${createdJob.crew_size} workers`],[`Work Type`,createdJob.work_type]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.muted,fontSize:13}}>{k}</span>
              <span style={{color:C.chalk,fontWeight:600,fontSize:13}}>{v}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:14,marginTop:4}}>
            <span style={{color:C.chalk,fontWeight:700}}>Dispatch Fee</span>
            <span style={{color:C.amber,fontWeight:900,fontSize:20}}>${parseFloat(createdJob.dispatch_fee||0).toLocaleString()}</span>
          </div>
        </div>
        <button onClick={handlePayment} disabled={payLoading} style={{...btn(),width:"100%",padding:"14px",fontSize:15,opacity:payLoading?0.6:1}}>
          {payLoading ? "Redirecting to payment..." : "💳 Pay Dispatch Fee →"}
        </button>
        {payError && <div style={{color:C.red,fontSize:12,marginTop:8,textAlign:"center"}}>{payError}</div>}
        <button onClick={()=>onNav("customer-portal")} style={{...btn("ghost"),width:"100%",marginTop:10}}>View in Customer Portal</button>
      </div>
    );
  }

  const steps = ["Company Info","Job Details","Review & Submit"];
  return (
    <div style={{padding:"36px",maxWidth:580,margin:"0 auto"}}>
      <SectionTitle title="Request Labor" sub="Crews matched and confirmed automatically." />
      <div style={{display:"flex",gap:8,marginBottom:28}}>
        {steps.map((s,i)=>(
          <div key={s} style={{flex:1,textAlign:"center"}}>
            <div style={{height:3,borderRadius:2,marginBottom:7,background:i<step-1?C.amber:i===step-1?C.amber:C.border,opacity:i>=step?0.25:1}}/>
            <div style={{fontSize:10,color:step===i+1?C.amber:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>{s}</div>
          </div>
        ))}
      </div>

      {step===1 && (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label style={label}>Company Name</label><input style={field} value={form.company} onChange={e=>up("company",e.target.value)} placeholder="Two Men and a Truck – Dallas"/></div>
          <div><label style={label}>Contact Name</label><input style={field} value={form.contact} onChange={e=>up("contact",e.target.value)} placeholder="Brian Cole"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={label}>Phone</label><input style={field} value={form.phone} onChange={e=>up("phone",e.target.value)} placeholder="(214) 555-0000"/></div>
            <div><label style={label}>Email</label><input style={field} value={form.email} onChange={e=>up("email",e.target.value)} placeholder="you@company.com"/></div>
          </div>
          <div>
            <label style={label}>Create a Password</label>
            <input type="password" style={field} value={form.password} onChange={e=>up("password",e.target.value)} placeholder="At least 6 characters"/>
            <div style={{fontSize:11,color:C.muted,marginTop:5}}>This creates your account so you can track this job in the Customer Portal.</div>
          </div>
        </div>
      )}

      {step===2 && (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:12}}>
            <div><label style={label}>City</label><input style={field} value={form.location} onChange={e=>up("location",e.target.value)} placeholder="Dallas"/></div>
            <div>
              <label style={label}>State</label>
              <select style={field} value={form.state} onChange={e=>up("state",e.target.value)}>
                <option value="">Select</option>
                {states.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={label}>ZIP</label><input style={field} value={form.zip} onChange={e=>up("zip",e.target.value)} placeholder="75201"/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={label}>Date</label>
              <input type="date" style={field} min={getMinBookableDate()} value={form.date} onChange={e=>up("date",e.target.value)}/>
              <div style={{fontSize:11,color:isDateTooSoon(form.date)?C.red:C.muted,marginTop:5}}>
                {isDateTooSoon(form.date)
                  ? `Please choose a date at least ${MIN_NOTICE_HOURS} hours out — for urgent same-day needs, text us directly at (347) 835-4479.`
                  : `Currently booking jobs ${MIN_NOTICE_HOURS}+ hours in advance.`}
              </div>
            </div>
            <div><label style={label}>Start Time</label><input type="time" style={field} value={form.time} onChange={e=>up("time",e.target.value)}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={label}>Crew Size</label>
              <select style={field} value={form.crew} onChange={e=>up("crew",e.target.value)}>
                {[1,2,3,4,5,6,7,8,10,12].map(n=><option key={n} value={n}>{n} workers</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Type of Work</label>
              <select style={field} value={form.type} onChange={e=>up("type",e.target.value)}>
                {["Load/Unload","Packing","Assembly","Full Service","Driving","Inventory"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div><label style={label}>Est. Duration (hours)</label><input style={field} value={form.duration} onChange={e=>up("duration",e.target.value)} placeholder="4"/></div>
          <div style={{display:"flex",flexDirection:"column",gap:8,background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px"}}>
            <label style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",fontSize:13,color:C.chalk}}>
              <input type="checkbox" checked={form.same_day} onChange={e=>up("same_day",e.target.checked)} style={{width:16,height:16,accentColor:C.amber,cursor:"pointer"}}/>
              Same-day / rush job <span style={{color:C.muted,fontSize:11}}>(+$15/worker — short notice)</span>
            </label>
            <label style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",fontSize:13,color:C.chalk}}>
              <input type="checkbox" checked={form.specialty_item} onChange={e=>up("specialty_item",e.target.checked)} style={{width:16,height:16,accentColor:C.amber,cursor:"pointer"}}/>
              Specialty item — piano, safe, fine art, gun safe, etc. <span style={{color:C.muted,fontSize:11}}>(+$75 flat)</span>
            </label>
          </div>
          <div><label style={label}>Special Requirements</label><textarea style={{...field,resize:"vertical",minHeight:72}} value={form.notes} onChange={e=>up("notes",e.target.value)} placeholder="Stairs, heavy items, military base access needed..."/></div>
        </div>
      )}

      {step===3 && (
        <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:14}}>Order Summary</div>
          {[["Company",form.company],["Contact",form.contact],["Location",`${form.location}, ${form.state}`],["Date & Time",`${form.date} at ${form.time}`],["Crew Size",`${form.crew} workers`],["Work Type",form.type],["Duration",`${form.duration} hrs`],...(form.same_day?[["Same-Day","Yes (+$15/worker)"]]:[]),...(form.specialty_item?[["Specialty Item","Yes (+$75 flat)"]]:[])].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.muted,fontSize:13}}>{k}</span>
              <span style={{color:C.chalk,fontSize:13,fontWeight:600}}>{v||"—"}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:14,marginTop:4}}>
            <span style={{color:C.chalk,fontWeight:700}}>Dispatch Fee</span>
            <span style={{color:C.amber,fontWeight:900,fontSize:22}}>${previewDispatchFee({work_type:form.type, crew:form.crew, date:form.date, same_day:form.same_day, specialty_item:form.specialty_item})}</span>
          </div>
          <div style={{fontSize:11,color:C.muted,marginTop:8}}>Pay workers directly on-site. TEMCO never processes payroll.</div>
          <div style={{marginTop:16,display:"flex",alignItems:"flex-start",gap:10}}>
            <input type="checkbox" id="tos" style={{marginTop:2,accentColor:C.amber,width:16,height:16,flexShrink:0}} required/>
            <label htmlFor="tos" style={{fontSize:12,color:C.muted,lineHeight:1.5,cursor:"pointer"}}>
              I agree to TEMCO's <span style={{color:C.amber,cursor:"pointer"}} onClick={()=>window.open('#terms','_blank')}>Terms of Service</span> and acknowledge that workers are independent contractors paid directly on-site. The dispatch fee is non-refundable once workers are confirmed.
            </label>
          </div>
        </div>
      )}

      {submitError && <div style={{color:C.red,fontSize:12,marginTop:14}}>{submitError}</div>}
      <div style={{display:"flex",gap:10,marginTop:20}}>
        {step>1 && <button onClick={()=>setStep(s=>s-1)} disabled={submitting} style={btn("ghost")}>← Back</button>}
        <button onClick={()=>step<3?setStep(s=>s+1):handleSubmit()} disabled={submitting} style={{...btn(),flex:1,opacity:submitting?0.6:1}}>
          {step===3 ? (submitting ? "Submitting..." : "Submit Request →") : "Continue →"}
        </button>
      </div>
    </div>
  );
}

// ─── WORKER SIGNUP ────────────────────────────────────────────────────────────
function WorkerSignup({ states }) {
  const [form, setForm] = useState({name:"",phone:"",email:"",city:"",state:"",skills:[],experience:"",notes:""});
  const [smsConsent, setSmsConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const up = (k,v) => setForm(p=>({...p,[k]:v}));
  const toggleSkill = s => setForm(p=>({...p,skills:p.skills.includes(s)?p.skills.filter(x=>x!==s):[...p.skills,s]}));

  const handleSubmit = async () => {
    if (!smsConsent) {
      setError("You must check the box agreeing to receive SMS messages from TEMCO to apply.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/workers/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sms_consent: smsConsent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Submission failed. Please check your details and try again.");
        return;
      }
      setSubmitted(true);
    } catch (e) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <div style={{padding:"64px 40px",maxWidth:460,margin:"0 auto",textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:14}}>🎉</div>
      <h2 style={{fontSize:22,fontWeight:800,color:C.chalk}}>Application Received</h2>
      <p style={{color:C.muted,lineHeight:1.7}}>We'll review your profile and reach out within 24 hours. Once approved, you'll receive job offers via SMS — no app needed.</p>
    </div>
  );

  return (
    <div style={{padding:"36px",maxWidth:540,margin:"0 auto"}}>
      <SectionTitle title="Become a Helper" sub="Join the TEMCO network. Get paid moving jobs texted directly to your phone." />
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div><label style={label}>Full Name</label><input style={field} value={form.name} onChange={e=>up("name",e.target.value)} placeholder="Marcus Johnson"/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div><label style={label}>Phone</label><input style={field} value={form.phone} onChange={e=>up("phone",e.target.value)} placeholder="(214) 555-0000"/></div>
          <div><label style={label}>Email</label><input style={field} value={form.email} onChange={e=>up("email",e.target.value)} placeholder="you@email.com"/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
          <div><label style={label}>City</label><input style={field} value={form.city} onChange={e=>up("city",e.target.value)} placeholder="Dallas"/></div>
          <div>
            <label style={label}>State</label>
            <select style={field} value={form.state} onChange={e=>up("state",e.target.value)}>
              <option value="">Select</option>
              {states.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div><label style={label}>Years of Experience</label><input style={field} value={form.experience} onChange={e=>up("experience",e.target.value)} placeholder="e.g. 8 years"/></div>
        <div>
          <label style={label}>Skills (select all that apply)</label>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {SKILL_TYPES.map(s=>(
              <button key={s} onClick={()=>toggleSkill(s)} style={{
                padding:"6px 13px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
                background:form.skills.includes(s)?C.amber:C.navyMid,
                color:form.skills.includes(s)?C.chalk:C.muted,
                border:`1px solid ${form.skills.includes(s)?C.amber:C.border}`
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div><label style={label}>Notes / Equipment / Crew Size</label><textarea style={{...field,resize:"vertical",minHeight:72}} value={form.notes} onChange={e=>up("notes",e.target.value)} placeholder="Own tools, dollies, travel radius, crew size..."/></div>
        <div style={{display:"flex",alignItems:"flex-start",gap:10,marginTop:4}}>
          <input
            type="checkbox"
            id="worker-tos"
            checked={smsConsent}
            onChange={e=>setSmsConsent(e.target.checked)}
            style={{marginTop:2,accentColor:C.amber,width:16,height:16,flexShrink:0,cursor:"pointer"}}
            required
          />
          <label htmlFor="worker-tos" style={{fontSize:12,color:C.muted,lineHeight:1.5,cursor:"pointer"}}>
            I agree to TEMCO's <span style={{color:C.amber}}>Worker Agreement</span> and understand I am joining as an independent contractor. I consent to receive automated SMS job offers from TEMCO, including job alerts and dispatch notifications. Message and data rates may apply. Message frequency varies. Reply STOP to any message to opt out, HELP for help.
          </label>
        </div>
        {error && <div style={{color:C.red,fontSize:12}}>{error}</div>}
        <button onClick={handleSubmit} disabled={submitting || !smsConsent} style={{...btn(),padding:"13px",fontSize:14,marginTop:4,opacity:(submitting||!smsConsent)?0.6:1}}>
          {submitting ? "Submitting..." : "Submit Application →"}
        </button>
      </div>
    </div>
  );
}

// ─── CUSTOMER LOGIN GATE ──────────────────────────────────────────────────────
function CustomerLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async () => {
    if (!email.trim() || !pw.trim()) { setError("Enter your email and password."); return; }
    setChecking(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw })
      });
      if (res.status === 401 || res.status === 403) {
        setError("Incorrect email or password.");
        setChecking(false);
        return;
      }
      if (!res.ok) {
        setError("Could not reach the server. Check your connection and try again.");
        setChecking(false);
        return;
      }
      const data = await res.json();
      onLogin(data.token);
    } catch (e) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 20px"}}>
      <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:14,padding:36,maxWidth:380,width:"100%"}}>
        <div style={{fontSize:13,color:C.amber,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Customer Portal</div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.chalk,margin:"0 0 18px"}}>Log In</h2>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input
            type="email"
            style={field}
            value={email}
            onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==="Enter" && submit()}
            placeholder="you@company.com"
            autoFocus
          />
          <input
            type="password"
            style={field}
            value={pw}
            onChange={e=>setPw(e.target.value)}
            onKeyDown={e=>e.key==="Enter" && submit()}
            placeholder="Password"
          />
        </div>
        {error && <div style={{color:C.red,fontSize:12,marginTop:8}}>{error}</div>}
        <button onClick={submit} disabled={checking} style={{...btn(),width:"100%",marginTop:16,opacity:checking?0.6:1}}>
          {checking ? "Checking..." : "Log In →"}
        </button>
        <div style={{fontSize:12,color:C.muted,marginTop:14,textAlign:"center"}}>
          No account yet? Submit a job request to create one automatically.
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOMER PORTAL ──────────────────────────────────────────────────────────
function CustomerPortal({ token, onLogout }) {
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadJobs() {
      setLoading(true);
      setLoadError("");
      try {
        const res = await fetch(`${API_BASE}/api/jobs`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const data = await res.json();
        if (!cancelled) setJobs(data.jobs || []);
      } catch (e) {
        if (!cancelled) setLoadError("Could not load your jobs. " + e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadJobs();
    return () => { cancelled = true; };
  }, [token]);

  const normalizedJobs = useMemo(() => jobs.map(j => ({
    id: j.job_number || j.id,
    location: [j.location_city, j.location_state].filter(Boolean).join(", "),
    date: j.job_date ? j.job_date.slice(0,10) : '—',
    crew: j.crew_size,
    type: j.work_type,
    status: j.status,
    fee: parseFloat(j.dispatch_fee) || 0,
  })), [jobs]);

  const totalSpend = normalizedJobs.reduce((a,j)=>a+j.fee,0);

  return (
    <div style={{padding:"30px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:12}}>
        <SectionTitle title="Customer Portal" sub="Track jobs, manage crews, and view invoices." />
        <button onClick={onLogout} style={{...btn("ghost"),padding:"6px 14px",fontSize:12}}>Log Out</button>
      </div>
      <Tabs tabs={[["jobs","My Jobs"],["billing","Invoices"],["request","New Request"]]} active={tab} onChange={setTab}/>

      {loadError && (
        <div style={{background:"#FDECEA",border:`1px solid ${C.red}55`,borderRadius:10,padding:"12px 16px",marginBottom:20,color:C.red,fontSize:13}}>
          {loadError}
        </div>
      )}

      {loading ? <Spinner/> : (
      <>
      {tab==="jobs" && (
        <>
          <div style={{display:"flex",gap:14,marginBottom:24,flexWrap:"wrap"}}>
            <StatCard label="Total Jobs" value={normalizedJobs.length} />
            <StatCard label="Active" value={normalizedJobs.filter(j=>j.status==="In Progress"||j.status==="Confirmed"||j.status==="Pending").length} color={C.amber}/>
            <StatCard label="Total Spent" value={`$${totalSpend.toLocaleString()}`} color={C.green}/>
          </div>
          {normalizedJobs.length===0 && <div style={{padding:30,color:C.muted,fontSize:13,textAlign:"center"}}>No jobs yet. Submit a request to get started.</div>}
          {normalizedJobs.length>0 && (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                {["Job ID","Location","Date","Crew","Type","Fee","Status"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"9px 12px",color:C.muted,fontWeight:700,fontSize:10,textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{normalizedJobs.map(j=>(
                <tr key={j.id} style={{borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:"11px 12px",color:C.amber,fontWeight:700}}>{j.id}</td>
                  <td style={{padding:"11px 12px",color:C.chalk}}>{j.location}</td>
                  <td style={{padding:"11px 12px",color:C.chalk}}>{j.date}</td>
                  <td style={{padding:"11px 12px",color:C.chalk}}>{j.crew}</td>
                  <td style={{padding:"11px 12px",color:C.chalk}}>{j.type}</td>
                  <td style={{padding:"11px 12px",color:C.green,fontWeight:700}}>${j.fee}</td>
                  <td style={{padding:"11px 12px"}}><Badge status={j.status}/></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          )}
        </>
      )}

      {tab==="billing" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {normalizedJobs.length===0 && <div style={{padding:30,color:C.muted,fontSize:13,textAlign:"center"}}>No invoices yet.</div>}
          {normalizedJobs.map(j=>(
            <div key={j.id} style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:10,padding:"15px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{fontWeight:700,color:C.chalk}}>{j.id} — {j.location}</div>
                <div style={{fontSize:12,color:C.muted}}>{j.date} · {j.crew} workers · {j.type}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:18,fontWeight:800,color:C.amber}}>${j.fee}</span>
                <Badge status={j.status}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="request" && <RequestForm onNav={()=>setTab("jobs")} onAuth={()=>{}} states={FALLBACK_STATES} />}
      </>
      )}
    </div>
  );
}

// ─── WORKER LOGIN GATE (phone + SMS one-time code) ───────────────────────────
function WorkerLogin({ onLogin }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentMsg, setSentMsg] = useState("");

  const requestCode = async () => {
    if (!phone.trim()) { setError("Enter your phone number."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/worker/request-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send code. Please try again.");
        setLoading(false);
        return;
      }
      setSentMsg(data.message || "Code sent.");
      setStep(2);
    } catch (e) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) { setError("Enter the code we texted you."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/worker/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect or expired code.");
        setLoading(false);
        return;
      }
      onLogin(data.token);
    } catch (e) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 20px"}}>
      <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:14,padding:36,maxWidth:380,width:"100%"}}>
        <div style={{fontSize:13,color:C.amber,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Worker Portal</div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.chalk,margin:"0 0 18px"}}>{step===1 ? "Enter Your Phone" : "Enter Your Code"}</h2>

        {step===1 ? (
          <>
            <input
              type="tel"
              style={field}
              value={phone}
              onChange={e=>setPhone(e.target.value)}
              onKeyDown={e=>e.key==="Enter" && requestCode()}
              placeholder="(214) 555-0000"
              autoFocus
            />
            {error && <div style={{color:C.red,fontSize:12,marginTop:8}}>{error}</div>}
            <button onClick={requestCode} disabled={loading} style={{...btn(),width:"100%",marginTop:16,opacity:loading?0.6:1}}>
              {loading ? "Sending..." : "Send Code →"}
            </button>
            <div style={{fontSize:12,color:C.muted,marginTop:14,textAlign:"center"}}>
              Must be the phone number you applied with.
            </div>
          </>
        ) : (
          <>
            {sentMsg && <div style={{color:C.green,fontSize:12,marginBottom:12}}>{sentMsg}</div>}
            <input
              type="text"
              inputMode="numeric"
              style={field}
              value={code}
              onChange={e=>setCode(e.target.value)}
              onKeyDown={e=>e.key==="Enter" && verifyCode()}
              placeholder="6-digit code"
              autoFocus
            />
            {error && <div style={{color:C.red,fontSize:12,marginTop:8}}>{error}</div>}
            <button onClick={verifyCode} disabled={loading} style={{...btn(),width:"100%",marginTop:16,opacity:loading?0.6:1}}>
              {loading ? "Verifying..." : "Log In →"}
            </button>
            <button onClick={()=>{setStep(1);setCode("");setError("");}} style={{...btn("ghost"),width:"100%",marginTop:10}}>
              ← Use a different number
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── WORKER PORTAL ────────────────────────────────────────────────────────────
function WorkerPortal({ token, onLogout }) {
  const [worker, setWorker] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [availLoading, setAvailLoading] = useState(false);

  // Consent gate state
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentSubmitting, setConsentSubmitting] = useState(false);
  const [consentError, setConsentError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setLoadError("");
      try {
        const [profileRes, jobsRes] = await Promise.all([
          fetch(`${API_BASE}/api/workers/me`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/workers/me/jobs`, { headers: { "Authorization": `Bearer ${token}` } })
        ]);
        if (!profileRes.ok) throw new Error(`Server responded ${profileRes.status}`);
        const profileData = await profileRes.json();
        const jobsData = jobsRes.ok ? await jobsRes.json() : { jobs: [] };
        if (!cancelled) {
          setWorker(profileData.worker);
          setJobs(jobsData.jobs || []);
        }
      } catch (e) {
        if (!cancelled) setLoadError("Could not load your profile. " + e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [token]);

  const confirmConsent = async () => {
    if (!consentChecked) { setConsentError("Please check the box to confirm."); return; }
    setConsentSubmitting(true);
    setConsentError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/worker/confirm-consent`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setWorker(prev => ({ ...prev, sms_consent_confirmed_at: data.worker.sms_consent_confirmed_at }));
      } else {
        setConsentError(data.error || "Could not save your confirmation. Please try again.");
      }
    } catch (e) {
      setConsentError("Could not reach the server. Check your connection and try again.");
    } finally {
      setConsentSubmitting(false);
    }
  };

  const toggleAvailability = async () => {
    if (!worker) return;
    const newStatus = worker.status === "active" ? "Unavailable" : "active";
    setAvailLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/workers/me/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setWorker(prev => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      console.error("Availability update failed", e);
    } finally {
      setAvailLoading(false);
    }
  };

  const normalizedJobs = useMemo(() => jobs.map(j => ({
    id: j.job_number,
    location: [j.location_city, j.location_state].filter(Boolean).join(", "),
    date: j.job_date ? j.job_date.slice(0,10) : '—',
    type: j.work_type,
    role: j.role,
    response: j.response,
    confirmed: j.confirmed,
    noShow: j.no_show,
    jobStatus: j.job_status,
  })), [jobs]);

  const isAvailable = worker?.status === "active";
  const needsConsent = worker && !worker.sms_consent_confirmed_at;

  return (
    <div style={{padding:"30px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:12}}>
        <SectionTitle title="Worker Portal" sub="Manage your profile, availability, and job offers." />
        <button onClick={onLogout} style={{...btn("ghost"),padding:"6px 14px",fontSize:12}}>Log Out</button>
      </div>

      {loadError && (
        <div style={{background:"#FDECEA",border:`1px solid ${C.red}55`,borderRadius:10,padding:"12px 16px",marginBottom:20,color:C.red,fontSize:13}}>
          {loadError}
        </div>
      )}

      {loading ? <Spinner/> : worker && (
        needsConsent ? (
          <div style={{maxWidth:520,margin:"20px auto"}}>
            <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:14,padding:32}}>
              <div style={{fontSize:13,color:C.amber,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>One More Step</div>
              <h2 style={{fontSize:20,fontWeight:800,color:C.chalk,margin:"0 0 14px"}}>Confirm Text Message Consent</h2>
              <p style={{fontSize:13,color:C.muted,lineHeight:1.7,marginBottom:20}}>
                Before you can receive job offers, please confirm you agree to receive SMS messages from TEMCO.
              </p>
              <div style={{background:C.navyLight,border:`1px solid ${C.border}`,borderRadius:10,padding:18,marginBottom:20}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                  <input
                    type="checkbox"
                    id="sms-consent"
                    checked={consentChecked}
                    onChange={e=>setConsentChecked(e.target.checked)}
                    style={{marginTop:2,accentColor:C.amber,width:16,height:16,flexShrink:0,cursor:"pointer"}}
                  />
                  <label htmlFor="sms-consent" style={{fontSize:13,color:C.chalk,lineHeight:1.6,cursor:"pointer"}}>
                    I agree to receive SMS messages from TEMCO National Labor Dispatch, including job alerts and dispatch notifications. Message and data rates may apply. Message frequency varies. Reply STOP at any time to opt out, HELP for help.
                  </label>
                </div>
              </div>
              {consentError && <div style={{color:C.red,fontSize:12,marginBottom:14}}>{consentError}</div>}
              <button
                onClick={confirmConsent}
                disabled={consentSubmitting || !consentChecked}
                style={{...btn(),width:"100%",padding:"13px",fontSize:14,opacity:(consentSubmitting||!consentChecked)?0.6:1}}
              >
                {consentSubmitting ? "Saving..." : "Confirm & Continue →"}
              </button>
            </div>
          </div>
        ) : (
      <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:22,flexWrap:"wrap"}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
            <div style={{width:54,height:54,borderRadius:"50%",background:C.amber,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:C.chalk,marginBottom:14}}>
              {worker.name ? worker.name.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase() : "?"}
            </div>
            <div style={{fontWeight:800,fontSize:17,color:C.chalk}}>{worker.name}</div>
            <div style={{fontSize:13,color:C.muted,marginTop:2}}>{worker.city}{worker.city && worker.state ? ", " : ""}{worker.state}</div>
            {worker.skills?.length>0 && (
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:12}}>
                {worker.skills.slice(0,4).map(s=>(
                  <span key={s} style={{fontSize:10,padding:"3px 9px",borderRadius:20,background:C.navyLight,color:C.muted}}>{s}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Availability</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{color:isAvailable?C.green:C.red,fontWeight:700,fontSize:14}}>{isAvailable?"Available":"Unavailable"}</span>
              <div onClick={availLoading?undefined:toggleAvailability} style={{width:44,height:24,borderRadius:12,cursor:availLoading?"wait":"pointer",background:isAvailable?C.green:C.border,position:"relative",transition:"background 0.2s",opacity:availLoading?0.6:1}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,left:isAvailable?23:3,transition:"left 0.2s"}}/>
              </div>
            </div>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
            <div style={{fontWeight:700,color:C.chalk,marginBottom:16}}>Your Job Offers</div>
            {normalizedJobs.length===0 ? (
              <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>
                No job offers yet. You'll get a text here when TEMCO has work matching your area and skills.
              </div>
            ) : normalizedJobs.map(j=>(
              <div key={j.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`,flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{color:C.chalk,fontWeight:600,fontSize:13}}>{j.location} — {j.type}</div>
                  <div style={{fontSize:12,color:C.muted}}>{j.date}{j.role ? ` · ${j.role}` : ""}</div>
                </div>
                <div style={{
                  fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20,
                  background:j.noShow?"#FDECEA":j.response==='YES'?"#E9F9EF":j.response==='NO'?"#FDECEA":"#F3F4F6",
                  color:j.noShow?C.red:j.response==='YES'?C.green:j.response==='NO'?C.red:C.muted
                }}>
                  {j.noShow?"NO-SHOW":j.response||"Pending"}
                </div>
              </div>
            ))}
          </div>

          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
            <div style={{fontWeight:700,color:C.chalk,marginBottom:14}}>How TEMCO Works for You</div>
            {[
              ["1","Get job offers by text","No app needed. Offers come straight to your phone."],
              ["2","Reply YES or NO","Simple one-word reply. System handles the rest."],
              ["3","Show up and get paid","Customer pays you directly on-site at the agreed rate."],
            ].map(([n,t,d])=>(
              <div key={n} style={{display:"flex",gap:12,marginBottom:14}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:C.amber,color:C.chalk,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,flexShrink:0}}>{n}</div>
                <div>
                  <div style={{color:C.chalk,fontWeight:600,fontSize:13}}>{t}</div>
                  <div style={{color:C.muted,fontSize:12,marginTop:2}}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        )
      )}
    </div>
  );
}

// ─── ADMIN LOGIN GATE ─────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async () => {
    if (!pw.trim()) { setError("Enter the admin password."); return; }
    setChecking(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw })
      });
      if (res.status === 401 || res.status === 403) {
        setError("Incorrect password.");
        setChecking(false);
        return;
      }
      if (!res.ok) {
        setError("Could not reach the server. Check your connection and try again.");
        setChecking(false);
        return;
      }
      const data = await res.json();
      onLogin(data.token);
    } catch (e) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 20px"}}>
      <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:14,padding:36,maxWidth:380,width:"100%"}}>
        <div style={{fontSize:13,color:C.amber,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Admin Access</div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.chalk,margin:"0 0 18px"}}>Enter Admin Password</h2>
        <input
          type="password"
          style={field}
          value={pw}
          onChange={e=>setPw(e.target.value)}
          onKeyDown={e=>e.key==="Enter" && submit()}
          placeholder="••••••••"
          autoFocus
        />
        {error && <div style={{color:C.red,fontSize:12,marginTop:8}}>{error}</div>}
        <button onClick={submit} disabled={checking} style={{...btn(),width:"100%",marginTop:16,opacity:checking?0.6:1}}>
          {checking ? "Checking..." : "Log In →"}
        </button>
      </div>
    </div>
  );
}

// ─── ADMIN PORTAL ─────────────────────────────────────────────────────────────
function AdminPortal({ token, onLogout }) {
  const [tab, setTab] = useState("today");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [partnerSearch, setPartnerSearch] = useState("");

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [liveJobs, setLiveJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsLoadError, setJobsLoadError] = useState("");

  const [expandedJobId, setExpandedJobId] = useState(null);
  const [jobWorkers, setJobWorkers] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [actionResults, setActionResults] = useState({});

  const [expandedWorkerId, setExpandedWorkerId] = useState(null);
  const [workerNotesDraft, setWorkerNotesDraft] = useState({});
  const [workerTempDraft, setWorkerTempDraft] = useState({});
  const [workerNoteSaving, setWorkerNoteSaving] = useState({});
  const [workerNoteResult, setWorkerNoteResult] = useState({});

  const [expandedPartnerSection, setExpandedPartnerSection] = useState(null);
  const [partnerDraft, setPartnerDraft] = useState({});
  const [partnerSaving, setPartnerSaving] = useState({});
  const [partnerSaveResult, setPartnerSaveResult] = useState({});

  const [todos, setTodos] = useState([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const [todosLoadError, setTodosLoadError] = useState("");
  const [newTodoText, setNewTodoText] = useState("");
  const [todoAdding, setTodoAdding] = useState(false);
  const [todoActionLoading, setTodoActionLoading] = useState({});

  const handleExpandJob = async (job) => {
    if (expandedJobId === job.rawId) { setExpandedJobId(null); return; }
    setExpandedJobId(job.rawId);
    if (!jobWorkers[job.rawId]) {
      try {
        const res = await fetch(`${API_BASE}/api/jobs/${job.rawId}/workers`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        setJobWorkers(prev => ({...prev, [job.rawId]: data.workers || []}));
      } catch(e) {
        setJobWorkers(prev => ({...prev, [job.rawId]: []}));
      }
    }
  };

  const handleReleaseCrewManually = async (jobId) => {
    setActionLoading(prev => ({...prev, [jobId]: true}));
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}/manual-release`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      const data = await res.json();
      setActionResults(prev => ({...prev, [jobId]: res.ok ? `✓ Crew info sent to customer — ${data.crew?.length || 0} workers released` : `Error: ${data.error}`}));
    } catch(e) {
      setActionResults(prev => ({...prev, [jobId]: "Could not reach server"}));
    } finally {
      setActionLoading(prev => ({...prev, [jobId]: false}));
    }
  };

  const handleFinalizePayment = async (jobId) => {
    if (!window.confirm("Capture payment for confirmed workers and release the crew to the customer? This charges the customer's held card for however many workers are currently confirmed.")) return;
    setActionLoading(prev => ({...prev, [jobId]: true}));
    try {
      const res = await fetch(`${API_BASE}/api/payments/${jobId}/finalize`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok) {
        setLiveJobs(prev => prev.map(j => j.id === jobId ? {...j, payment_status: "Paid"} : j));
        setActionResults(prev => ({...prev, [jobId]: `✓ Captured $${data.capturedAmount} for ${data.confirmedCount} of ${data.requestedCrew} requested workers — crew released to customer`}));
      } else {
        setActionResults(prev => ({...prev, [jobId]: `Error: ${data.error}`}));
      }
    } catch(e) {
      setActionResults(prev => ({...prev, [jobId]: "Could not reach server"}));
    } finally {
      setActionLoading(prev => ({...prev, [jobId]: false}));
    }
  };

  const handleCancelHold = async (jobId) => {
    if (!window.confirm("Release the payment hold with no charge? Use this if a crew genuinely couldn't be filled — the customer will not be charged.")) return;
    setActionLoading(prev => ({...prev, [jobId]: true}));
    try {
      const res = await fetch(`${API_BASE}/api/payments/${jobId}/cancel-hold`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok) {
        setLiveJobs(prev => prev.map(j => j.id === jobId ? {...j, payment_status: "Hold Released"} : j));
        setActionResults(prev => ({...prev, [jobId]: "✓ Payment hold released — customer was not charged"}));
      } else {
        setActionResults(prev => ({...prev, [jobId]: `Error: ${data.error}`}));
      }
    } catch(e) {
      setActionResults(prev => ({...prev, [jobId]: "Could not reach server"}));
    } finally {
      setActionLoading(prev => ({...prev, [jobId]: false}));
    }
  };

  const handleRedispatch = async (jobId) => {
    setActionLoading(prev => ({...prev, [jobId]: true}));
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}/redispatch`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      const data = await res.json();
      setActionResults(prev => ({...prev, [jobId]: res.ok ? "✓ Additional dispatch triggered — contacting more workers" : `Error: ${data.error}`}));
    } catch(e) {
      setActionResults(prev => ({...prev, [jobId]: "Could not reach server"}));
    } finally {
      setActionLoading(prev => ({...prev, [jobId]: false}));
    }
  };

  const handleCancelJob = async (jobId) => {
    if (!window.confirm("Cancel this job? This cannot be undone.")) return;
    setActionLoading(prev => ({...prev, [jobId]: true}));
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelled" })
      });
      if (res.ok) {
        setLiveJobs(prev => prev.map(j => j.id === jobId ? {...j, status: "Cancelled"} : j));
        setActionResults(prev => ({...prev, [jobId]: "✓ Job cancelled."}));
      } else {
        const data = await res.json().catch(() => ({}));
        setActionResults(prev => ({...prev, [jobId]: `Error: ${data.error || "Could not cancel job"}`}));
      }
    } catch(e) {
      setActionResults(prev => ({...prev, [jobId]: "Could not reach server"}));
    } finally {
      setActionLoading(prev => ({...prev, [jobId]: false}));
    }
  };

  const handleMarkCompleted = async (jobId) => {
    if (!window.confirm("Mark this job as Completed? This will also text the customer a one-time follow-up invite.")) return;
    setActionLoading(prev => ({...prev, [jobId]: true}));
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" })
      });
      if (res.ok) {
        setLiveJobs(prev => prev.map(j => j.id === jobId ? {...j, status: "Completed"} : j));
        setActionResults(prev => ({...prev, [jobId]: "✓ Job marked Completed — follow-up text sent to customer."}));
      } else {
        const data = await res.json().catch(() => ({}));
        setActionResults(prev => ({...prev, [jobId]: `Error: ${data.error || "Could not update job"}`}));
      }
    } catch(e) {
      setActionResults(prev => ({...prev, [jobId]: "Could not reach server"}));
    } finally {
      setActionLoading(prev => ({...prev, [jobId]: false}));
    }
  };

  const handleNoShow = async (jobId, workerId, workerName) => {
    if (!window.confirm(`Mark ${workerName} as a no-show? This will reduce their dispatch priority.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}/noshow/${workerId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setJobWorkers(prev => ({...prev, [jobId]: (prev[jobId]||[]).map(w => w.worker_id===workerId ? {...w, no_show:true} : w)}));
        setActionResults(prev => ({...prev, [jobId]: `⚠ ${workerName} marked as no-show. Rating reduced.`}));
      }
    } catch(e) { console.error("No-show update failed", e); }
  };

  const handleSaveWorkerNote = async (workerId) => {
    setWorkerNoteSaving(prev => ({...prev, [workerId]: true}));
    setWorkerNoteResult(prev => ({...prev, [workerId]: ""}));
    try {
      const res = await fetch(`${API_BASE}/api/workers/${workerId}/notes`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notes: workerNotesDraft[workerId] ?? "", temperature: workerTempDraft[workerId] ?? "" })
      });
      const data = await res.json();
      if (res.ok) {
        setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, notes: data.worker.notes, temperature: data.worker.temperature, last_contacted: data.worker.last_contacted } : w));
        setWorkerNoteResult(prev => ({...prev, [workerId]: "✓ Saved"}));
      } else {
        setWorkerNoteResult(prev => ({...prev, [workerId]: `Error: ${data.error}`}));
      }
    } catch (e) {
      setWorkerNoteResult(prev => ({...prev, [workerId]: "Could not reach server"}));
    } finally {
      setWorkerNoteSaving(prev => ({...prev, [workerId]: false}));
    }
  };

  const handleSavePartnerDetails = async (customerId, fields) => {
    if (!customerId) {
      setPartnerSaveResult(prev => ({...prev, [expandedPartnerSection]: "No customer ID on file for this partner — cannot save yet."}));
      return;
    }
    setPartnerSaving(prev => ({...prev, [expandedPartnerSection]: true}));
    setPartnerSaveResult(prev => ({...prev, [expandedPartnerSection]: ""}));
    try {
      const res = await fetch(`${API_BASE}/api/auth/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(fields)
      });
      const data = await res.json();
      if (res.ok) {
        setLiveJobs(prev => prev.map(j => j.customer_id === customerId ? {
          ...j,
          company_address: data.customer.company_address,
          company_phone: data.customer.company_phone,
          website: data.customer.website,
          dot_number: data.customer.dot_number,
          fleet_size: data.customer.fleet_size,
          contact_position: data.customer.contact_position,
          contact_direct_phone: data.customer.contact_direct_phone,
          contact_type: data.customer.contact_type,
          contact_type_detail: data.customer.contact_type_detail,
          customer_notes: data.customer.notes,
          customer_last_contacted: data.customer.last_contacted,
        } : j));
        setPartnerSaveResult(prev => ({...prev, [expandedPartnerSection]: "✓ Saved"}));
      } else {
        setPartnerSaveResult(prev => ({...prev, [expandedPartnerSection]: `Error: ${data.error}`}));
      }
    } catch (e) {
      setPartnerSaveResult(prev => ({...prev, [expandedPartnerSection]: "Could not reach server"}));
    } finally {
      setPartnerSaving(prev => ({...prev, [expandedPartnerSection]: false}));
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadTodos() {
      setTodosLoading(true);
      setTodosLoadError("");
      try {
        const res = await fetch(`${API_BASE}/api/todos`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const data = await res.json();
        if (!cancelled) setTodos(data.todos || []);
      } catch (e) {
        if (!cancelled) setTodosLoadError("Could not load to-do list. " + e.message);
      } finally {
        if (!cancelled) setTodosLoading(false);
      }
    }
    loadTodos();
    return () => { cancelled = true; };
  }, [token]);

  const handleAddTodo = async () => {
    if (!newTodoText.trim()) return;
    setTodoAdding(true);
    try {
      const res = await fetch(`${API_BASE}/api/todos`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTodoText.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setTodos(prev => [data.todo, ...prev]);
        setNewTodoText("");
      }
    } catch (e) {
      console.error("Add todo failed", e);
    } finally {
      setTodoAdding(false);
    }
  };

  const handleToggleTodo = async (id, currentDone) => {
    setTodoActionLoading(prev => ({...prev, [id]: true}));
    try {
      const res = await fetch(`${API_BASE}/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ done: !currentDone })
      });
      if (res.ok) {
        const data = await res.json();
        setTodos(prev => prev.map(t => t.id === id ? data.todo : t));
      }
    } catch (e) {
      console.error("Toggle todo failed", e);
    } finally {
      setTodoActionLoading(prev => ({...prev, [id]: false}));
    }
  };

  const handleDeleteTodo = async (id) => {
    setTodoActionLoading(prev => ({...prev, [id]: true}));
    try {
      const res = await fetch(`${API_BASE}/api/todos/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setTodos(prev => prev.filter(t => t.id !== id));
      }
    } catch (e) {
      console.error("Delete todo failed", e);
    } finally {
      setTodoActionLoading(prev => ({...prev, [id]: false}));
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadJobs() {
      setJobsLoading(true);
      setJobsLoadError("");
      try {
        const res = await fetch(`${API_BASE}/api/jobs/admin/all`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.jobs || []);
        if (!cancelled) setLiveJobs(list);
      } catch (e) {
        if (!cancelled) setJobsLoadError("Could not load live job data. " + e.message);
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    }
    loadJobs();
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    async function loadWorkers() {
      setLoading(true);
      setLoadError("");
      try {
        const res = await fetch(`${API_BASE}/api/workers?limit=1000`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.workers || data.data || []);
        if (!cancelled) setWorkers(list);
      } catch (e) {
        if (!cancelled) setLoadError("Could not load live worker data. " + e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadWorkers();
    return () => { cancelled = true; };
  }, [token]);

  const normalizedWorkers = useMemo(() => workers.map(w => ({
    id: w.id,
    name: w.name || "—",
    phone: w.phone || "—",
    email: w.email || "",
    city: w.city || "",
    state: (w.state || "").toUpperCase(),
    skills: w.skills || [],
    certifications: w.certifications || w.cids || "",
    comments: w.comments || "",
    status: w.status || "active",
    crew: w.crew_size || w.crew || null,
    travel: w.travel_radius || w.travel || null,
    bases: w.bases_access ?? w.bases ?? false,
    experience: w.experience || null,
    notes: w.notes || "",
    last_contacted: w.last_contacted || null,
    temperature: w.temperature || "",
  })), [workers]);

  const STATES = useMemo(() => [...new Set(normalizedWorkers.map(w => w.state).filter(Boolean))].sort(), [normalizedWorkers]);

  const filteredWorkers = useMemo(() => {
    return normalizedWorkers.filter(w => {
      const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.city.toLowerCase().includes(search.toLowerCase()) || w.comments?.toLowerCase().includes(search.toLowerCase());
      const matchState = !stateFilter || w.state === stateFilter;
      const matchSkill = !skillFilter || (w.skills && w.skills.includes(skillFilter));
      const matchStatus = !statusFilter || w.status === statusFilter;
      return matchSearch && matchState && matchSkill && matchStatus;
    });
  }, [normalizedWorkers, search, stateFilter, skillFilter, statusFilter]);

  const byState = STATES.map(s=>({state:s, count:normalizedWorkers.filter(w=>w.state===s).length})).sort((a,b)=>b.count-a.count);

  const normalizedJobs = useMemo(() => liveJobs.map(j => ({
    rawId: j.id,
    id: j.job_number || j.id,
    customer: j.company || j.contact_name || "—",
    location: [j.location_city, j.location_state].filter(Boolean).join(", "),
    date: j.job_date ? j.job_date.slice(0, 10) : '—',
    time: j.job_time ? j.job_time.slice(0, 5) : '—',
    crew: j.crew_size,
    type: j.work_type,
    status: j.status,
    payment_status: j.payment_status,
    fee: parseFloat(j.dispatch_fee) || 0,
  })), [liveJobs]);

  const totalFees = normalizedJobs.reduce((a,j)=>a+(j.fee||0),0);

  const partners = useMemo(() => {
    const map = {};
    liveJobs.forEach(j => {
      const key = j.customer_id || j.customer_email || j.company || j.contact_name;
      if (!key) return;
      if (!map[key]) {
        map[key] = {
          key,
          customerId: j.customer_id,
          company: j.company || "—",
          contact_name: j.contact_name || "—",
          email: j.customer_email || "—",
          phone: j.customer_phone || "",
          jobCount: 0,
          totalRevenue: 0,
          lastActive: null,
          company_address: j.company_address || "",
          company_phone: j.company_phone || "",
          website: j.website || "",
          dot_number: j.dot_number || "",
          fleet_size: j.fleet_size || "",
          contact_position: j.contact_position || "",
          contact_direct_phone: j.contact_direct_phone || "",
          contact_type: j.contact_type || "",
          contact_type_detail: j.contact_type_detail || "",
          notes: j.customer_notes || "",
          last_contacted: j.customer_last_contacted || null,
        };
      }
      map[key].jobCount += 1;
      map[key].totalRevenue += parseFloat(j.dispatch_fee) || 0;
      const jobDate = j.job_date ? new Date(j.job_date) : (j.created_at ? new Date(j.created_at) : null);
      if (jobDate && (!map[key].lastActive || jobDate > map[key].lastActive)) {
        map[key].lastActive = jobDate;
      }
    });
    return Object.values(map).sort((a,b) => (b.lastActive||0) - (a.lastActive||0));
  }, [liveJobs]);

  const filteredPartners = useMemo(() => {
    if (!partnerSearch) return partners;
    const q = partnerSearch.toLowerCase();
    return partners.filter(p =>
      p.company.toLowerCase().includes(q) ||
      p.contact_name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  }, [partners, partnerSearch]);

  const jobsNeedingAction = useMemo(() =>
    normalizedJobs.filter(j => ["Pending","Dispatching"].includes(j.status))
  , [normalizedJobs]);

  const workersWentQuiet = useMemo(() =>
    normalizedWorkers.filter(w => w.temperature === "Went Quiet")
  , [normalizedWorkers]);

  const workersNeverContacted = useMemo(() =>
    normalizedWorkers.filter(w => !w.last_contacted)
  , [normalizedWorkers]);

  const partnersNeedingCheckIn = useMemo(() => {
    const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return partners.filter(p => {
      if (!p.last_contacted) return true;
      return (now - new Date(p.last_contacted).getTime()) > FOURTEEN_DAYS;
    });
  }, [partners]);

  return (
    <div style={{padding:"28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <SectionTitle title="Admin Dashboard" sub="TEMCO National Dispatch Operations" />
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:C.navyMid,padding:"6px 14px",borderRadius:8,border:`1px solid ${C.border}`}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:(loadError||jobsLoadError)?C.red:C.green,boxShadow:`0 0 8px ${(loadError||jobsLoadError)?C.red:C.green}`}}/>
            <span style={{color:(loadError||jobsLoadError)?C.red:C.green,fontSize:12,fontWeight:700}}>{(loadError||jobsLoadError) ? "DATA ERROR" : "SYSTEM LIVE"}</span>
          </div>
          <button onClick={onLogout} style={{...btn("ghost"),padding:"6px 14px",fontSize:12}}>Log Out</button>
        </div>
      </div>

      {(loadError || jobsLoadError) && (
        <div style={{background:"#FDECEA",border:`1px solid ${C.red}55`,borderRadius:10,padding:"12px 16px",marginBottom:20,color:C.red,fontSize:13}}>
          {[loadError, jobsLoadError].filter(Boolean).join(" ")} — showing what data is available below.
        </div>
      )}

      <Tabs tabs={[["today","Today"],["overview","Overview"],["workers","Workers"],["jobs","All Jobs"],["partners","Partners"],["dispatch","Dispatch Sim"]]} active={tab} onChange={setTab}/>

      {(loading || jobsLoading) ? <Spinner/> : (
      <>
      {tab==="today" && (
        <div>
          <div style={{display:"flex",gap:14,marginBottom:24,flexWrap:"wrap"}}>
            <StatCard label="Jobs Needing Action" value={jobsNeedingAction.length} color={C.amber}/>
            <StatCard label="Workers Gone Quiet" value={workersWentQuiet.length} color={C.red}/>
            <StatCard label="Never Contacted" value={workersNeverContacted.length} color={C.blue}/>
            <StatCard label="Partners to Check In On" value={partnersNeedingCheckIn.length} color={C.chalk}/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
              <div style={{fontWeight:700,color:C.chalk,marginBottom:12}}>📋 Jobs Needing Action</div>
              {jobsNeedingAction.length===0 ? (
                <div style={{color:C.muted,fontSize:13}}>Nothing pending — all caught up.</div>
              ) : jobsNeedingAction.slice(0,8).map(j=>(
                <div key={j.rawId} onClick={()=>{setTab("jobs");}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer",flexWrap:"wrap",gap:6}}>
                  <div>
                    <span style={{color:C.amber,fontWeight:700,marginRight:8,fontSize:12}}>{j.id}</span>
                    <span style={{color:C.chalk,fontSize:12}}>{j.customer} — {j.location}</span>
                  </div>
                  <Badge status={j.status}/>
                </div>
              ))}
              {jobsNeedingAction.length>8 && <div style={{fontSize:11,color:C.muted,marginTop:8}}>+{jobsNeedingAction.length-8} more — see All Jobs tab</div>}
            </div>

            <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
              <div style={{fontWeight:700,color:C.chalk,marginBottom:12}}>🥶 Workers Gone Quiet</div>
              {workersWentQuiet.length===0 ? (
                <div style={{color:C.muted,fontSize:13}}>No one flagged as quiet right now.</div>
              ) : workersWentQuiet.slice(0,8).map(w=>(
                <div key={w.id} onClick={()=>{setTab("workers");setSearch(w.name);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer",flexWrap:"wrap",gap:6}}>
                  <div>
                    <span style={{color:C.chalk,fontWeight:600,fontSize:12}}>{w.name}</span>
                    <span style={{color:C.muted,fontSize:11,marginLeft:8}}>{w.city}, {w.state}</span>
                  </div>
                  <span style={{color:C.muted,fontSize:11}}>{w.phone}</span>
                </div>
              ))}
              {workersWentQuiet.length>8 && <div style={{fontSize:11,color:C.muted,marginTop:8}}>+{workersWentQuiet.length-8} more — see Workers tab</div>}
            </div>

            <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
              <div style={{fontWeight:700,color:C.chalk,marginBottom:12}}>📱 Workers Never Contacted</div>
              {workersNeverContacted.length===0 ? (
                <div style={{color:C.muted,fontSize:13}}>Everyone's had at least one touchpoint.</div>
              ) : (
                <div style={{color:C.muted,fontSize:13,lineHeight:1.7}}>
                  {workersNeverContacted.length} workers haven't been contacted yet — worth an intro blast or a batch of check-in calls. <span style={{color:C.amber,cursor:"pointer",fontWeight:600}} onClick={()=>setTab("workers")}>Go to Workers →</span>
                </div>
              )}
            </div>

            <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
              <div style={{fontWeight:700,color:C.chalk,marginBottom:12}}>🤝 Partners to Check In On</div>
              {partnersNeedingCheckIn.length===0 ? (
                <div style={{color:C.muted,fontSize:13}}>Everyone's been contacted in the last 2 weeks.</div>
              ) : partnersNeedingCheckIn.slice(0,8).map(p=>(
                <div key={p.key} onClick={()=>{setTab("partners");setPartnerSearch(p.company!=="—"?p.company:p.contact_name);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer",flexWrap:"wrap",gap:6}}>
                  <div>
                    <span style={{color:C.chalk,fontWeight:600,fontSize:12}}>{p.company}</span>
                    <span style={{color:C.muted,fontSize:11,marginLeft:8}}>{p.contact_name}</span>
                  </div>
                  <span style={{color:C.muted,fontSize:11}}>{p.last_contacted ? `Last: ${new Date(p.last_contacted).toLocaleDateString()}` : "Never contacted"}</span>
                </div>
              ))}
              {partnersNeedingCheckIn.length>8 && <div style={{fontSize:11,color:C.muted,marginTop:8}}>+{partnersNeedingCheckIn.length-8} more — see Partners tab</div>}
            </div>
          </div>

          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
            <div style={{fontWeight:700,color:C.chalk,marginBottom:14}}>✏️ To-Do List</div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <input
                style={{...field,flex:1}}
                value={newTodoText}
                onChange={e=>setNewTodoText(e.target.value)}
                onKeyDown={e=>e.key==="Enter" && handleAddTodo()}
                placeholder="Add something to remember for today..."
              />
              <button onClick={handleAddTodo} disabled={todoAdding || !newTodoText.trim()} style={{...btn(),padding:"10px 18px",opacity:(todoAdding||!newTodoText.trim())?0.6:1}}>
                {todoAdding ? "Adding..." : "+ Add"}
              </button>
            </div>

            {todosLoadError && (
              <div style={{color:C.red,fontSize:12,marginBottom:12}}>{todosLoadError}</div>
            )}

            {todosLoading ? (
              <div style={{color:C.muted,fontSize:13}}>Loading to-do list...</div>
            ) : todos.length===0 ? (
              <div style={{color:C.muted,fontSize:13}}>Nothing on your list yet — add something above.</div>
            ) : (
              <div>
                {todos.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${C.border}`,opacity:todoActionLoading[t.id]?0.5:1}}>
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={()=>handleToggleTodo(t.id, t.done)}
                      disabled={!!todoActionLoading[t.id]}
                      style={{width:16,height:16,accentColor:C.amber,cursor:"pointer",flexShrink:0}}
                    />
                    <span style={{flex:1,fontSize:13,color:t.done?C.muted:C.chalk,textDecoration:t.done?"line-through":"none"}}>{t.text}</span>
                    <button onClick={()=>handleDeleteTodo(t.id)} disabled={!!todoActionLoading[t.id]} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:"2px 6px"}}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab==="overview" && (
        <div>
          <div style={{display:"flex",gap:14,marginBottom:24,flexWrap:"wrap"}}>
            <StatCard label="Workers in Network" value={normalizedWorkers.length} color={C.green} sub={`${STATES.length} states`}/>
            <StatCard label="Active Jobs" value={normalizedJobs.filter(j=>j.status==="In Progress"||j.status==="Confirmed"||j.status==="Pending").length} color={C.amber}/>
            <StatCard label="Revenue (MTD)" value={`$${totalFees.toLocaleString()}`} color={C.chalk}/>
            <StatCard label="Fill Rate" value="97%" color={C.green}/>
          </div>

          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22,marginBottom:20}}>
            <div style={{fontWeight:700,color:C.chalk,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              <span>Live Dispatch Activity</span>
              <div style={{width:6,height:6,borderRadius:"50%",background:C.green,boxShadow:`0 0 6px ${C.green}`}}/>
            </div>
            {normalizedJobs.filter(j=>j.status!=="Completed").map(j=>(
              <div key={j.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${C.border}`,flexWrap:"wrap",gap:8}}>
                <div>
                  <span style={{color:C.amber,fontWeight:700,marginRight:10}}>{j.id}</span>
                  <span style={{color:C.chalk,fontSize:13}}>{j.customer}</span>
                </div>
                <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{color:C.muted,fontSize:12}}>{j.location} · {j.date}</span>
                  <span style={{color:C.chalk,fontSize:12}}>{j.crew} workers</span>
                  <span style={{color:C.green,fontWeight:700,fontSize:13}}>${j.fee}</span>
                  <Badge status={j.status}/>
                </div>
              </div>
            ))}
          </div>

          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
            <div style={{fontWeight:700,color:C.chalk,marginBottom:16}}>Network Coverage by State</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
              {byState.slice(0,21).map(({state:st,count})=>(
                <div key={st} style={{background:C.navyLight,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{color:C.chalk,fontWeight:600,fontSize:13}}>{st}</span>
                  <span style={{color:C.amber,fontWeight:800,fontSize:14}}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="workers" && (
        <div>
          <div style={{display:"flex",gap:14,marginBottom:20,flexWrap:"wrap"}}>
            <StatCard label="Total Workers" value={normalizedWorkers.length} sub={`${STATES.length} states covered`}/>
            <StatCard label="With Crew/Team" value={normalizedWorkers.filter(w=>w.crew).length} color={C.amber}/>
            <StatCard label="Military Base Access" value={normalizedWorkers.filter(w=>w.bases).length} color={C.green}/>
            <StatCard label="Active Status" value={normalizedWorkers.filter(w=>w.status==="active").length} color={C.blue}/>
            <StatCard label="Went Quiet" value={normalizedWorkers.filter(w=>w.temperature==="Went Quiet").length} color={C.red}/>
          </div>

          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            <input style={{...field,flex:2,minWidth:160}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, city, or notes..."/>
            <select style={{...field,flex:1,minWidth:100}} value={stateFilter} onChange={e=>setStateFilter(e.target.value)}>
              <option value="">All States</option>
              {STATES.map(s=><option key={s}>{s}</option>)}
            </select>
            <select style={{...field,flex:1,minWidth:120}} value={skillFilter} onChange={e=>setSkillFilter(e.target.value)}>
              <option value="">All Skills</option>
              {SKILL_TYPES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{fontSize:12,color:C.muted}}>Showing {filteredWorkers.length} of {normalizedWorkers.length} workers — click a row to add relationship notes</div>
            <button
              onClick={()=>exportToCSV(
                `temco-workers-${new Date().toISOString().slice(0,10)}.csv`,
                filteredWorkers,
                [
                  ["Name", w=>w.name],
                  ["City", w=>w.city],
                  ["State", w=>w.state],
                  ["Phone", w=>w.phone],
                  ["Email", w=>w.email],
                  ["Skills", w=>(w.skills||[]).join("; ")],
                  ["Experience", w=>w.experience],
                  ["Crew Size", w=>w.crew],
                  ["Travel Radius", w=>w.travel],
                  ["Base Access", w=>w.bases ? "Yes" : "No"],
                  ["Status", w=>w.status],
                  ["Temperature", w=>w.temperature],
                  ["Last Contacted", w=>w.last_contacted ? new Date(w.last_contacted).toLocaleString() : ""],
                  ["Notes", w=>w.notes],
                ]
              )}
              style={{...btn("ghost"),padding:"7px 14px",fontSize:12}}
            >
              ⬇ Export CSV ({filteredWorkers.length})
            </button>
          </div>

          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                {["Name","Location","Phone","Last Contacted","Notes","Temp","Status"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"9px 12px",color:C.muted,fontWeight:700,fontSize:10,textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{filteredWorkers.slice(0,100).map(w=>(
                <Fragment key={w.id}>
                <tr onClick={()=>{
                    if (expandedWorkerId===w.id) { setExpandedWorkerId(null); return; }
                    setExpandedWorkerId(w.id);
                    setWorkerNotesDraft(prev => ({...prev, [w.id]: prev[w.id] ?? w.notes ?? ""}));
                    setWorkerTempDraft(prev => ({...prev, [w.id]: prev[w.id] ?? w.temperature ?? ""}));
                  }} style={{borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:expandedWorkerId===w.id?C.navyLight:"transparent"}}>
                  <td style={{padding:"11px 12px"}}>
                    <div style={{color:C.chalk,fontWeight:600}}>{w.name}</div>
                    {w.experience && <div style={{fontSize:10,color:C.amber}}>{w.experience} exp</div>}
                  </td>
                  <td style={{padding:"11px 12px",color:C.chalk}}>{w.city}{w.city && w.state ? ", " : ""}{w.state}</td>
                  <td style={{padding:"11px 12px",color:C.muted,fontSize:12}}>{w.phone}</td>
                  <td style={{padding:"11px 12px",color:C.muted,fontSize:11}}>{w.last_contacted ? new Date(w.last_contacted).toLocaleDateString() : "Never"}</td>
                  <td style={{padding:"11px 12px",color:C.muted,fontSize:11}}>{w.notes ? (w.notes.slice(0,30) + (w.notes.length>30?"...":"")) : "—"}</td>
                  <td style={{padding:"11px 12px"}}>
                    {w.temperature ? (
                      <span style={{background:TEMP_COLORS[w.temperature]?.bg||"#222",color:TEMP_COLORS[w.temperature]?.color||"#aaa",padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:800,letterSpacing:"0.04em"}}>{w.temperature}</span>
                    ) : <span style={{color:C.muted,fontSize:11}}>—</span>}
                  </td>
                  <td style={{padding:"11px 12px"}}><Badge status={w.status}/></td>
                </tr>
                {expandedWorkerId===w.id && (
                  <tr>
                    <td colSpan={7} style={{padding:"14px 18px",background:C.navyLight,borderBottom:`1px solid ${C.border}`}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 200px",gap:14,marginBottom:8}}>
                        <div>
                          <label style={label}>Relationship Notes</label>
                          <textarea
                            style={{...field,resize:"vertical",minHeight:64}}
                            value={workerNotesDraft[w.id] ?? ""}
                            onChange={e=>setWorkerNotesDraft(prev=>({...prev,[w.id]:e.target.value}))}
                            placeholder="e.g. Called 7/20 — reliable, prefers weekend jobs, interested in crew lead role..."
                          />
                        </div>
                        <div>
                          <label style={label}>Temperature</label>
                          <select style={field} value={workerTempDraft[w.id] ?? ""} onChange={e=>setWorkerTempDraft(prev=>({...prev,[w.id]:e.target.value}))}>
                            <option value="">— Not set —</option>
                            {TEMP_OPTIONS.map(t=><option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:10,alignItems:"center",marginTop:8}}>
                        <button onClick={()=>handleSaveWorkerNote(w.id)} disabled={!!workerNoteSaving[w.id]} style={{...btn(),padding:"8px 16px",fontSize:12,opacity:workerNoteSaving[w.id]?0.6:1}}>
                          {workerNoteSaving[w.id] ? "Saving..." : "Save"}
                        </button>
                        {workerNoteResult[w.id] && (
                          <span style={{fontSize:12,color:workerNoteResult[w.id].startsWith("✓")?C.green:C.red,fontWeight:600}}>{workerNoteResult[w.id]}</span>
                        )}
                        {w.last_contacted && (
                          <span style={{fontSize:11,color:C.muted}}>Last contacted: {new Date(w.last_contacted).toLocaleString()}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}</tbody>
            </table>
            {filteredWorkers.length>100 && <div style={{padding:14,color:C.muted,fontSize:12,textAlign:"center"}}>Showing first 100 results. Refine filters to narrow down.</div>}
            {filteredWorkers.length===0 && !loading && <div style={{padding:30,color:C.muted,fontSize:13,textAlign:"center"}}>No workers match these filters.</div>}
          </div>
        </div>
      )}

      {tab==="jobs" && (
        <div>
          <div style={{display:"flex",gap:14,marginBottom:20,flexWrap:"wrap"}}>
            <StatCard label="Total Jobs" value={normalizedJobs.length}/>
            <StatCard label="Revenue" value={`$${totalFees.toLocaleString()}`} color={C.green}/>
            <StatCard label="Active" value={normalizedJobs.filter(j=>["Pending","Dispatching","Confirmed"].includes(j.status)).length} color={C.amber}/>
            <StatCard label="Completed" value={normalizedJobs.filter(j=>j.status==="Completed").length} color={C.muted}/>
          </div>
          {normalizedJobs.length===0 && <div style={{padding:30,color:C.muted,fontSize:13,textAlign:"center"}}>No jobs yet. Submitted requests will appear here.</div>}
          {normalizedJobs.map(j=>(
            <div key={j.rawId} style={{background:C.navyMid,border:`1px solid ${expandedJobId===j.rawId?C.amber:C.border}`,borderRadius:10,marginBottom:10,overflow:"hidden",transition:"border-color 0.2s"}}>
              <div onClick={()=>handleExpandJob(j)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",flexWrap:"wrap",gap:10,cursor:"pointer"}}>
                <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{color:C.amber,fontWeight:800,fontSize:14}}>{j.id}</span>
                  <span style={{color:C.chalk,fontSize:13,fontWeight:600}}>{j.customer}</span>
                  <span style={{color:C.muted,fontSize:12}}>{j.location}</span>
                  <span style={{color:C.muted,fontSize:12}}>{j.date}</span>
                  <span style={{color:C.chalk,fontSize:12}}>{j.crew} workers</span>
                  <span style={{color:C.green,fontWeight:700}}>${j.fee}</span>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <Badge status={j.status}/>
                  <span style={{color:C.muted,fontSize:12}}>{expandedJobId===j.rawId?"▲":"▼"}</span>
                </div>
              </div>

              {expandedJobId===j.rawId && (
                <div style={{borderTop:`1px solid ${C.border}`,padding:"18px 18px"}}>
                  <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                    <button onClick={()=>handleReleaseCrewManually(j.rawId)} disabled={!!actionLoading[j.rawId]} style={{background:C.green,color:"white",border:"none",padding:"8px 16px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",opacity:actionLoading[j.rawId]?0.6:1}}>
                      📤 Release Crew to Customer
                    </button>
                    {j.payment_status==="Authorized" && (
                      <button onClick={()=>handleFinalizePayment(j.rawId)} disabled={!!actionLoading[j.rawId]} style={{background:C.amber,color:C.chalk,border:"none",padding:"8px 16px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",opacity:actionLoading[j.rawId]?0.6:1}}>
                        💳 Finalize & Capture Payment
                      </button>
                    )}
                    {j.payment_status==="Authorized" && (
                      <button onClick={()=>handleCancelHold(j.rawId)} disabled={!!actionLoading[j.rawId]} style={{background:"transparent",color:C.muted,border:`1px solid ${C.border}`,padding:"8px 16px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",opacity:actionLoading[j.rawId]?0.6:1}}>
                        🔓 Release Hold (No Charge)
                      </button>
                    )}
                    <button onClick={()=>handleRedispatch(j.rawId)} disabled={!!actionLoading[j.rawId]} style={{background:C.blue,color:"white",border:"none",padding:"8px 16px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",opacity:actionLoading[j.rawId]?0.6:1}}>
                      🔄 Re-Dispatch More Workers
                    </button>
                    {j.status!=="Cancelled" && j.status!=="Completed" && (
                      <button onClick={()=>handleMarkCompleted(j.rawId)} disabled={!!actionLoading[j.rawId]} style={{background:C.amber,color:C.chalk,border:"none",padding:"8px 16px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",opacity:actionLoading[j.rawId]?0.6:1}}>
                        ✓ Mark Completed
                      </button>
                    )}
                    {j.status!=="Cancelled" && j.status!=="Completed" && (
                      <button onClick={()=>handleCancelJob(j.rawId)} disabled={!!actionLoading[j.rawId]} style={{background:"transparent",color:C.red,border:`1px solid ${C.red}66`,padding:"8px 16px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",opacity:actionLoading[j.rawId]?0.6:1}}>
                        ✕ Cancel Job
                      </button>
                    )}
                  </div>

                  {actionResults[j.rawId] && (
                    <div style={{fontSize:12,color:actionResults[j.rawId].startsWith("✓")?C.green:actionResults[j.rawId].startsWith("⚠")?C.amber:C.red,marginBottom:14,padding:"8px 14px",background:C.navyLight,borderRadius:6,fontWeight:600}}>
                      {actionResults[j.rawId]}
                    </div>
                  )}

                  <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Assigned Workers</div>
                  {!jobWorkers[j.rawId] ? (
                    <div style={{color:C.muted,fontSize:13}}>Loading...</div>
                  ) : jobWorkers[j.rawId].length===0 ? (
                    <div style={{color:C.muted,fontSize:13}}>No workers assigned yet. Use Re-Dispatch to find workers.</div>
                  ) : (
                    jobWorkers[j.rawId].map(w=>(
                      <div key={w.worker_id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`,flexWrap:"wrap",gap:8}}>
                        <div>
                          <span style={{color:C.chalk,fontWeight:600,fontSize:13}}>{w.name}</span>
                          <span style={{color:C.muted,fontSize:12,marginLeft:10}}>{w.phone}</span>
                          <span style={{fontSize:10,color:C.blue,marginLeft:10,fontWeight:700}}>{w.role}</span>
                          {w.city && <span style={{color:C.muted,fontSize:11,marginLeft:8}}>{w.city}, {w.state}</span>}
                        </div>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <span style={{
                            fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20,
                            background:w.response==='YES'?"#E9F9EF":w.response==='NO'?"#FDECEA":w.no_show?"#FDECEA":"#F3F4F6",
                            color:w.response==='YES'?C.green:w.response==='NO'?C.red:w.no_show?C.red:C.muted
                          }}>
                            {w.no_show?"NO-SHOW":w.response||"Pending"}
                          </span>
                          {w.sms_sent && !w.response && !w.no_show && (
                            <span style={{fontSize:10,color:C.muted}}>📱 SMS sent</span>
                          )}
                          {w.confirmed && !w.no_show && (
                            <button onClick={()=>handleNoShow(j.rawId, w.worker_id, w.name)} style={{background:"transparent",color:C.red,border:`1px solid ${C.red}44`,padding:"3px 10px",borderRadius:6,fontSize:10,fontWeight:700,cursor:"pointer"}}>
                              Mark No-Show
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="partners" && (
        <div>
          <div style={{display:"flex",gap:14,marginBottom:20,flexWrap:"wrap"}}>
            <StatCard label="Total Partners" value={partners.length} color={C.green}/>
            <StatCard label="Repeat Customers" value={partners.filter(p=>p.jobCount>1).length} color={C.amber}/>
            <StatCard label="Total Revenue" value={`$${partners.reduce((a,p)=>a+p.totalRevenue,0).toLocaleString()}`} color={C.chalk}/>
          </div>

          <div style={{fontSize:12,color:C.muted,marginBottom:16,lineHeight:1.6}}>
            This list is built automatically from customers who've submitted job requests — no separate signup needed. Click a company name for company details, or a contact name for role and direct contact info.
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
            <input style={{...field,maxWidth:400,marginBottom:0}} value={partnerSearch} onChange={e=>setPartnerSearch(e.target.value)} placeholder="Search by company, contact, or email..."/>
            <button
              onClick={()=>exportToCSV(
                `temco-partners-${new Date().toISOString().slice(0,10)}.csv`,
                filteredPartners,
                [
                  ["Company", p=>p.company],
                  ["Contact Name", p=>p.contact_name],
                  ["Contact Type", p=>p.contact_type],
                  ["Type Detail", p=>p.contact_type_detail],
                  ["Position", p=>p.contact_position],
                  ["Email", p=>p.email],
                  ["Phone", p=>p.phone],
                  ["Direct Phone", p=>p.contact_direct_phone],
                  ["Company Address", p=>p.company_address],
                  ["Company Phone", p=>p.company_phone],
                  ["Website", p=>p.website],
                  ["DOT/MC Number", p=>p.dot_number],
                  ["Fleet Size", p=>p.fleet_size],
                  ["Jobs", p=>p.jobCount],
                  ["Total Revenue", p=>p.totalRevenue],
                  ["Last Active", p=>p.lastActive ? p.lastActive.toLocaleDateString() : ""],
                  ["Notes", p=>p.notes],
                ]
              )}
              style={{...btn("ghost"),padding:"7px 14px",fontSize:12}}
            >
              ⬇ Export CSV ({filteredPartners.length})
            </button>
          </div>

          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                {["Company","Contact","Email","Jobs","Revenue","Last Active"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"9px 12px",color:C.muted,fontWeight:700,fontSize:10,textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{filteredPartners.map(p=>{
                const companyKey = `${p.customerId}:company`;
                const contactKey = `${p.customerId}:contact`;
                const isCompanyOpen = expandedPartnerSection === companyKey;
                const isContactOpen = expandedPartnerSection === contactKey;

                const openCompany = () => {
                  if (isCompanyOpen) { setExpandedPartnerSection(null); return; }
                  setExpandedPartnerSection(companyKey);
                  setPartnerDraft(prev => ({...prev, [companyKey]: prev[companyKey] ?? {
                    company_address: p.company_address, company_phone: p.company_phone,
                    website: p.website, dot_number: p.dot_number, fleet_size: p.fleet_size,
                  }}));
                };
                const openContact = () => {
                  if (isContactOpen) { setExpandedPartnerSection(null); return; }
                  setExpandedPartnerSection(contactKey);
                  setPartnerDraft(prev => ({...prev, [contactKey]: prev[contactKey] ?? {
                    contact_position: p.contact_position, contact_direct_phone: p.contact_direct_phone,
                    contact_type: p.contact_type, contact_type_detail: p.contact_type_detail,
                  }}));
                };

                const contactTypeLabel = { Driver: "Van Line / Company Driving For", "Moving Company": "Position / Role", Broker: "Brokerage Company Name" }[partnerDraft[contactKey]?.contact_type] || "Type Detail";

                return (
                  <Fragment key={p.key}>
                  <tr style={{borderBottom:`1px solid ${C.border}`}}>
                    <td style={{padding:"11px 12px",color:C.amber,fontWeight:600,cursor:"pointer",textDecoration:"underline"}} onClick={openCompany}>{p.company}</td>
                    <td style={{padding:"11px 12px",color:C.amber,cursor:"pointer",textDecoration:"underline"}} onClick={openContact}>{p.contact_name}</td>
                    <td style={{padding:"11px 12px",color:C.muted,fontSize:12}}>{p.email}</td>
                    <td style={{padding:"11px 12px",color:C.chalk}}>{p.jobCount}</td>
                    <td style={{padding:"11px 12px",color:C.green,fontWeight:700}}>${p.totalRevenue.toLocaleString()}</td>
                    <td style={{padding:"11px 12px",color:C.muted,fontSize:12}}>{p.lastActive ? p.lastActive.toLocaleDateString() : "—"}</td>
                  </tr>

                  {isCompanyOpen && (
                    <tr>
                      <td colSpan={6} style={{padding:"16px 18px",background:C.navyLight,borderBottom:`1px solid ${C.border}`}}>
                        <div style={{fontSize:11,color:C.amber,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Company Details — {p.company}</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                          <div><label style={label}>Company Address</label><input style={field} value={partnerDraft[companyKey]?.company_address ?? ""} onChange={e=>setPartnerDraft(prev=>({...prev,[companyKey]:{...prev[companyKey],company_address:e.target.value}}))} placeholder="123 Main St, City, ST ZIP"/></div>
                          <div><label style={label}>Company Phone</label><input style={field} value={partnerDraft[companyKey]?.company_phone ?? ""} onChange={e=>setPartnerDraft(prev=>({...prev,[companyKey]:{...prev[companyKey],company_phone:e.target.value}}))} placeholder="Main office line, if different"/></div>
                          <div><label style={label}>Website</label><input style={field} value={partnerDraft[companyKey]?.website ?? ""} onChange={e=>setPartnerDraft(prev=>({...prev,[companyKey]:{...prev[companyKey],website:e.target.value}}))} placeholder="https://..."/></div>
                          <div><label style={label}>DOT / MC Number</label><input style={field} value={partnerDraft[companyKey]?.dot_number ?? ""} onChange={e=>setPartnerDraft(prev=>({...prev,[companyKey]:{...prev[companyKey],dot_number:e.target.value}}))} placeholder="DOT#1234567"/></div>
                          <div><label style={label}>Fleet Size</label><input style={field} value={partnerDraft[companyKey]?.fleet_size ?? ""} onChange={e=>setPartnerDraft(prev=>({...prev,[companyKey]:{...prev[companyKey],fleet_size:e.target.value}}))} placeholder="e.g. 12 trucks"/></div>
                        </div>
                        <div style={{display:"flex",gap:10,alignItems:"center"}}>
                          <button onClick={()=>handleSavePartnerDetails(p.customerId, partnerDraft[companyKey])} disabled={!!partnerSaving[companyKey]} style={{...btn(),padding:"8px 16px",fontSize:12,opacity:partnerSaving[companyKey]?0.6:1}}>
                            {partnerSaving[companyKey] ? "Saving..." : "Save Company Details"}
                          </button>
                          {partnerSaveResult[companyKey] && (
                            <span style={{fontSize:12,color:partnerSaveResult[companyKey].startsWith("✓")?C.green:C.red,fontWeight:600}}>{partnerSaveResult[companyKey]}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {isContactOpen && (
                    <tr>
                      <td colSpan={6} style={{padding:"16px 18px",background:C.navyLight,borderBottom:`1px solid ${C.border}`}}>
                        <div style={{fontSize:11,color:C.amber,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Contact Details — {p.contact_name}</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                          <div>
                            <label style={label}>Contact Type</label>
                            <select style={field} value={partnerDraft[contactKey]?.contact_type ?? ""} onChange={e=>setPartnerDraft(prev=>({...prev,[contactKey]:{...prev[contactKey],contact_type:e.target.value}}))}>
                              <option value="">Select type</option>
                              <option value="Driver">Driver</option>
                              <option value="Moving Company">Moving Company</option>
                              <option value="Broker">Broker</option>
                            </select>
                          </div>
                          <div><label style={label}>{contactTypeLabel}</label><input style={field} value={partnerDraft[contactKey]?.contact_type_detail ?? ""} onChange={e=>setPartnerDraft(prev=>({...prev,[contactKey]:{...prev[contactKey],contact_type_detail:e.target.value}}))} placeholder="e.g. Atlas Van Lines"/></div>
                          <div><label style={label}>Position / Role</label><input style={field} value={partnerDraft[contactKey]?.contact_position ?? ""} onChange={e=>setPartnerDraft(prev=>({...prev,[contactKey]:{...prev[contactKey],contact_position:e.target.value}}))} placeholder="Dispatcher, Owner, Ops Manager..."/></div>
                          <div><label style={label}>Direct Phone</label><input style={field} value={partnerDraft[contactKey]?.contact_direct_phone ?? ""} onChange={e=>setPartnerDraft(prev=>({...prev,[contactKey]:{...prev[contactKey],contact_direct_phone:e.target.value}}))} placeholder="If different from company line"/></div>
                        </div>
                        <div style={{display:"flex",gap:10,alignItems:"center"}}>
                          <button onClick={()=>handleSavePartnerDetails(p.customerId, partnerDraft[contactKey])} disabled={!!partnerSaving[contactKey]} style={{...btn(),padding:"8px 16px",fontSize:12,opacity:partnerSaving[contactKey]?0.6:1}}>
                            {partnerSaving[contactKey] ? "Saving..." : "Save Contact Details"}
                          </button>
                          {partnerSaveResult[contactKey] && (
                            <span style={{fontSize:12,color:partnerSaveResult[contactKey].startsWith("✓")?C.green:C.red,fontWeight:600}}>{partnerSaveResult[contactKey]}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}</tbody>
            </table>
            {filteredPartners.length===0 && <div style={{padding:30,color:C.muted,fontSize:13,textAlign:"center"}}>No partners match this search.</div>}
          </div>
        </div>
      )}

      {tab==="dispatch" && <DispatchSim workers={normalizedWorkers} states={STATES} />}
      </>
      )}
    </div>
  );
}

// ─── DISPATCH SIMULATOR ───────────────────────────────────────────────────────
function DispatchSim({ workers, states }) {
  const [state, setState] = useState("");
  const [skill, setSkill] = useState("Loading");
  const [crew, setCrew] = useState(4);
  const [dispatched, setDispatched] = useState(false);
  const [responses, setResponses] = useState({});

  const candidates = useMemo(()=>{
    if (!state) return [];
    return workers.filter(w=>w.state===state && (!skill || (w.skills && w.skills.includes(skill)) || w.skills?.length===0)).slice(0,crew+2);
  },[state,skill,crew,workers]);

  const runDispatch = () => {
    setDispatched(true);
    const r = {};
    candidates.forEach((w,i)=>{
      r[w.id] = i < crew ? "YES" : "BACKUP";
    });
    setResponses(r);
  };

  return (
    <div>
      <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:24,marginBottom:20}}>
        <div style={{fontWeight:700,color:C.chalk,marginBottom:16}}>AI Dispatch Simulator</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Simulate how the AI matching agent would find and dispatch workers for a job, using live worker data.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
          <div>
            <label style={label}>State</label>
            <select style={field} value={state} onChange={e=>{setState(e.target.value);setDispatched(false);}}>
              <option value="">Select state</option>
              {states.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Skill Needed</label>
            <select style={field} value={skill} onChange={e=>{setSkill(e.target.value);setDispatched(false);}}>
              {SKILL_TYPES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Crew Size</label>
            <select style={field} value={crew} onChange={e=>{setCrew(parseInt(e.target.value));setDispatched(false);}}>
              {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} workers</option>)}
            </select>
          </div>
        </div>
        <button onClick={runDispatch} disabled={!state} style={{...btn(),opacity:state?1:0.5}}>
          🤖 Run AI Dispatch →
        </button>
      </div>

      {candidates.length>0 && (
        <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
          <div style={{fontWeight:700,color:C.chalk,marginBottom:6}}>
            {dispatched ? `Dispatch Sent — ${candidates.length} workers contacted` : `${candidates.length} workers found in ${state}`}
          </div>
          <div style={{fontSize:12,color:C.muted,marginBottom:16}}>
            {dispatched ? `Targeting ${crew} confirmed + ${Math.max(candidates.length-crew,0)} backups` : "Run dispatch to send SMS offers"}
          </div>
          {candidates.map((w,i)=>(
            <div key={w.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`,flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{color:C.chalk,fontWeight:600}}>{w.name}</div>
                <div style={{fontSize:12,color:C.muted}}>{w.city}, {w.state} · {w.phone}</div>
                {w.experience && <div style={{fontSize:11,color:C.amber}}>{w.experience} experience</div>}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {dispatched && (
                  <div style={{
                    padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:800,
                    background:responses[w.id]==="YES"?"#E9F9EF":responses[w.id]==="BACKUP"?"#EFF6FF":"#FDECEA",
                    color:responses[w.id]==="YES"?C.green:responses[w.id]==="BACKUP"?C.blue:C.red
                  }}>
                    {responses[w.id]==="YES"?"✓ CONFIRMED":responses[w.id]==="BACKUP"?"⏳ BACKUP":"📱 SENT"}
                  </div>
                )}
                <div style={{background:C.navyLight,padding:"3px 10px",borderRadius:10,fontSize:10,color:C.muted,fontWeight:600}}>
                  #{i+1} match
                </div>
              </div>
            </div>
          ))}
          {dispatched && (
            <div style={{marginTop:16,padding:14,background:"#E9F9EF",borderRadius:8,color:C.green,fontWeight:700,fontSize:13}}>
              ✓ {Math.min(crew,candidates.length)} workers confirmed for dispatch · Dispatch fee: ${crew*100} · Worker info will release upon payment
            </div>
          )}
        </div>
      )}

      {state && candidates.length===0 && (
        <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22,color:C.muted,textAlign:"center"}}>
          No workers found for {skill} in {state}. Try a different state or skill.
        </div>
      )}
    </div>
  );
}

// ─── LEGAL PAGES ─────────────────────────────────────────────────────────────
function LegalPage({ title, children, onNav }) {
  return (
    <div style={{maxWidth:720,margin:"0 auto",padding:"40px 28px"}}>
      <button onClick={()=>onNav("home")} style={{...btn("ghost"),marginBottom:24,fontSize:12,padding:"6px 14px"}}>← Back to Home</button>
      <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:14,padding:36}}>
        <div style={{fontSize:11,color:C.amber,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Legal</div>
        <h1 style={{fontSize:24,fontWeight:800,color:C.chalk,marginBottom:4}}>{title}</h1>
        <div style={{fontSize:12,color:C.muted,marginBottom:28}}>The Empire Moving Co., LLC d/b/a TEMCO National Labor Dispatch Network · Effective July 7, 2026</div>
        {children}
      </div>
      <div style={{marginTop:20,textAlign:"center",fontSize:11,color:C.muted}}>
        © 2026 The Empire Moving Co., LLC d/b/a TEMCO National Labor Dispatch Network
      </div>
    </div>
  );
}

function section(title) {
  return <div style={{fontSize:11,fontWeight:700,color:"#F5A623",letterSpacing:"0.08em",textTransform:"uppercase",marginTop:28,marginBottom:10}}>{title}</div>;
}
function para(text) {
  return <p style={{fontSize:13,color:"#C8D0DC",lineHeight:1.7,marginBottom:10}}>{text}</p>;
}
function bullet(items) {
  return <ul style={{margin:"6px 0 12px 18px"}}>{items.map((t,i)=><li key={i} style={{fontSize:13,color:"#C8D0DC",lineHeight:1.6,marginBottom:5}}>{t}</li>)}</ul>;
}

function TermsPage({ onNav }) {
  return (
    <LegalPage title="Terms of Service" onNav={onNav}>
      {section("1. About TEMCO")}
      {para("TEMCO National Labor Dispatch Network is operated by The Empire Moving Co., LLC, a California limited liability company. TEMCO is a labor dispatch marketplace — a technology platform that connects businesses seeking moving labor with independent workers available in their area. TEMCO is not a moving company, staffing agency, or employer.")}
      {section("2. Dispatch Fee & Payment")}
      {para("TEMCO charges a dispatch fee of $75–$125 per Helper dispatched, based on job type, crew size, and timing. This fee is charged via Stripe upon crew confirmation.")}
      {para("⚠ The dispatch fee is non-refundable once workers have been contacted and confirmed for your job.")}
      {section("3. Worker Compensation")}
      {para("Helpers are paid directly by the Customer on-site. TEMCO does not process, hold, or distribute worker pay. The dispatch fee is entirely separate from worker compensation.")}
      {section("4. Customer Responsibilities")}
      {bullet(["Provide accurate job details","Pay Helpers directly on-site","Provide a safe working environment compliant with OSHA regulations","Not solicit or directly hire Helpers found through TEMCO for 12 months","Report no-shows or incidents to TEMCO promptly"])}
      {section("5. Independent Contractor Status")}
      {para("All Helpers are independent contractors, not employees of TEMCO or the Customer. Customers are responsible for compliance with all applicable contractor engagement laws in their state.")}
      {section("6. Limitation of Liability")}
      {para("TEMCO is not liable for property damage, cargo loss, personal injury, no-shows, pay disputes, or platform downtime. TEMCO's total liability shall not exceed the dispatch fee paid for the specific job.")}
      {section("7. Disputes & Governing Law")}
      {para("Disputes shall be resolved through binding arbitration in Fresno, California under AAA Commercial Arbitration Rules. These Terms are governed by California law.")}
      {section("8. Contact")}
      {para("The Empire Moving Co., LLC d/b/a TEMCO · Phone/Text: (347) 835-4479 · Email: empireofdaena@gmail.com")}
    </LegalPage>
  );
}

function PrivacyPage({ onNav }) {
  return (
    <LegalPage title="Privacy Policy" onNav={onNav}>
      {para("This Privacy Policy explains how The Empire Moving Co., LLC d/b/a TEMCO collects, uses, and protects your personal information. CCPA rights apply to California residents.")}
      {section("Information We Collect")}
      {bullet(["Customer: company name, contact, email, phone, job details, payment info (via Stripe)","Worker: name, phone, email, city, state, skills, job history, SMS responses","Automatically: SMS logs, dispatch activity, usage data"])}
      {section("How We Use Your Information")}
      {bullet(["Matching and dispatching workers to jobs","Sending SMS job offers and confirmations (via Twilio)","Processing payments (via Stripe — card data never stored by TEMCO)","Platform operations and compliance"])}
      {section("Third-Party Services")}
      {bullet(["Twilio — SMS delivery","Stripe — Payment processing (PCI compliant)","OpenAI — AI worker matching (anonymized job data only)","Railway — Database hosting","Vercel — Web hosting"])}
      {para("These service providers process data solely to deliver the services described above (SMS delivery, payment processing, AI matching, hosting) and are contractually and technically restricted from using your information for their own marketing purposes or sharing it further.")}
      {section("SMS & TCPA Compliance")}
      {para("By joining TEMCO, you consent to receive automated SMS messages. Message and data rates may apply. Reply STOP to opt out at any time. Reply START to re-enroll.")}
      {para("No mobile information collected for SMS/text messaging purposes will be shared with third parties or affiliates for marketing or promotional purposes. Your phone number and SMS opt-in status are used solely to send job dispatch offers, confirmations, and operational updates related to TEMCO's labor dispatch service. This information is not sold, rented, or shared with any third party for their own marketing purposes.")}
      {section("Data Sharing")}
      {para("TEMCO does not sell personal information. Worker contact info is shared with Customers only after payment is confirmed, solely for job coordination.")}
      {section("California Privacy Rights (CCPA)")}
      {bullet(["Right to Know — request a summary of data we hold","Right to Delete — request deletion of your data","Right to Opt Out — we do not sell data","Right to Non-Discrimination — we will not discriminate for exercising rights"])}
      {section("Contact")}
      {para("The Empire Moving Co., LLC d/b/a TEMCO · (347) 835-4479 · empireofdaena@gmail.com")}
    </LegalPage>
  );
}

function WorkerAgreementPage({ onNav }) {
  return (
    <LegalPage title="Worker (Helper) Agreement" onNav={onNav}>
      {para("By joining the TEMCO network you agree to these terms. You are joining as an independent contractor, not as an employee of The Empire Moving Co., LLC or any Customer.")}
      {section("Your Status")}
      {bullet(["You are an independent contractor — not a TEMCO employee","You are responsible for your own taxes including self-employment tax","You are not entitled to employee benefits or workers' compensation through TEMCO","You may work for other companies simultaneously","You retain the right to accept or decline any job offer"])}
      {section("How TEMCO Works for You")}
      {bullet(["TEMCO texts you job offers in your area — always your choice to accept","Reply YES to accept, NO to decline","Show up and get paid directly by the Customer on-site","TEMCO never handles your pay — what the Customer pays you is 100% yours"])}
      {section("Pay & Compensation")}
      {para("TEMCO does not set, guarantee, or process your pay. Compensation is negotiated with and paid by the Customer on-site. TEMCO's dispatch fee does not come out of your pay in any way.")}
      {section("Job Responsibilities")}
      {bullet(["Arrive on time at the specified location","Perform work professionally and safely","Notify TEMCO immediately if you cannot fulfill a confirmed job","Conduct yourself professionally at all times"])}
      {section("No-Show Policy")}
      {para("Repeated no-shows without notice may result in reduced dispatch priority or removal from the TEMCO network. Contact (347) 835-4479 immediately if you cannot make a confirmed job.")}
      {section("SMS Consent (TCPA)")}
      {para("By joining TEMCO, you expressly consent to receive automated SMS job offers and updates. Message and data rates may apply. Reply STOP to opt out. Reply START to re-enroll.")}
      {section("Non-Solicitation")}
      {para("You agree not to solicit direct engagements from TEMCO Customers for 6 months after your last TEMCO job with that Customer without TEMCO's written consent.")}
      {section("Contact")}
      {para("The Empire Moving Co., LLC d/b/a TEMCO · (347) 835-4479 · empireofdaena@gmail.com")}
    </LegalPage>
  );
}

// ─── PAYMENT SUCCESS ──────────────────────────────────────────────────────────
function PaymentSuccess({ onNav }) {
  return (
    <div style={{padding:"64px 40px",maxWidth:500,margin:"0 auto",textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:14}}>✅</div>
      <h2 style={{fontSize:24,fontWeight:800,color:C.chalk,marginBottom:8}}>Payment Method Confirmed</h2>
      <p style={{color:C.muted,lineHeight:1.7,marginBottom:28}}>
        Your card is authorized and held — you won't be charged until your crew is confirmed. We're matching your job with available workers now, and you'll get a text the moment your crew is locked in.
      </p>
      <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:24}}>
        <div style={{fontSize:13,color:C.muted,lineHeight:1.8}}>
          <div>✓ Payment method authorized (not yet charged)</div>
          <div>✓ Matching workers to your job now</div>
          <div>✓ You'll be charged only once a crew is confirmed</div>
        </div>
      </div>
      <button onClick={()=>onNav("home")} style={{...btn(),padding:"13px 28px"}}>Back to Home →</button>
    </div>
  );
}

// ─── PAYMENT CANCELLED ────────────────────────────────────────────────────────
function PaymentCancelled({ onNav }) {
  return (
    <div style={{padding:"64px 40px",maxWidth:500,margin:"0 auto",textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:14}}>↩️</div>
      <h2 style={{fontSize:24,fontWeight:800,color:C.chalk,marginBottom:8}}>Payment Cancelled</h2>
      <p style={{color:C.muted,lineHeight:1.7,marginBottom:28}}>
        No charge was made. Your job request is still saved — complete payment any time to confirm your crew.
      </p>
      <button onClick={()=>onNav("request")} style={{...btn(),padding:"13px 28px"}}>Submit New Request →</button>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const KNOWN_ROUTES = ["request","worker-signup","customer-portal","worker-portal","admin","terms","privacy","worker-agreement","payment-success","payment-cancelled"];

function pageForPath(pathname) {
  const seg = pathname.replace(/\/+$/,"").split("/").filter(Boolean)[0] || "";
  return KNOWN_ROUTES.includes(seg) ? seg : "home";
}
function pathForPage(page) {
  return page === "home" ? "/" : `/${page}`;
}

export default function App() {
  const [page, setPage] = useState(() => pageForPath(window.location.pathname));
  const [adminToken, setAdminToken] = useState(null);
  const [customerToken, setCustomerToken] = useState(() => localStorage.getItem('temco_customer_token'));
  const [workerToken, setWorkerToken] = useState(() => localStorage.getItem('temco_worker_token'));

  const navigate = (newPage) => {
    const path = pathForPage(newPage);
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setPage(newPage);
  };

  useEffect(() => {
    setPage(pageForPath(window.location.pathname));
    const onPopState = () => setPage(pageForPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleAdminLogout = () => {
    setAdminToken(null);
    navigate("home");
  };

  const handleCustomerLogout = () => {
    localStorage.removeItem('temco_customer_token');
    setCustomerToken(null);
    navigate("home");
  };

  const handleCustomerAuth = (t) => {
    localStorage.setItem('temco_customer_token', t);
    setCustomerToken(t);
  };

  const handleWorkerLogout = () => {
    localStorage.removeItem('temco_worker_token');
    setWorkerToken(null);
    navigate("home");
  };

  const handleWorkerAuth = (t) => {
    localStorage.setItem('temco_worker_token', t);
    setWorkerToken(t);
  };

  useEffect(() => {
    const titles = {
      home: "TEMCO — Nationwide Moving Labor Dispatch",
      request: "Request Labor — TEMCO",
      "worker-signup": "Become a Helper — TEMCO",
      "customer-portal": "Customer Portal — TEMCO",
      "worker-portal": "Worker Portal — TEMCO",
      admin: "Admin — TEMCO",
      terms: "Terms of Service — TEMCO",
      privacy: "Privacy Policy — TEMCO",
      "worker-agreement": "Worker Agreement — TEMCO",
    };
    document.title = titles[page] || "TEMCO — Nationwide Moving Labor Dispatch";

    let favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23FF5A1F'/%3E%3Ctext x='16' y='23' font-family='Arial,sans-serif' font-weight='900' font-size='18' fill='%231A1D23' text-anchor='middle'%3ET%3C/text%3E%3C/svg%3E";
  }, [page]);

  const NAV_LEFT = [
    {id:"home",label:"Home"},
    {id:"request",label:"Request Labor"},
    {id:"worker-signup",label:"Become a Helper"},
  ];
  const NAV_RIGHT = [
    {id:"customer-portal",label:"Customer Portal"},
    {id:"worker-portal",label:"Worker Portal"},
    {id:"admin",label:"⚙ Admin"},
  ];

  const pages = {
    home:<PublicHome onNav={navigate} workerCount={546} stateCount={49}/>,
    request:<RequestForm onNav={navigate} onAuth={handleCustomerAuth} states={FALLBACK_STATES}/>,
    "worker-signup":<WorkerSignup states={FALLBACK_STATES}/>,
    "customer-portal": customerToken
      ? <CustomerPortal token={customerToken} onLogout={handleCustomerLogout}/>
      : <CustomerLogin onLogin={handleCustomerAuth}/>,
    "worker-portal": workerToken
      ? <WorkerPortal token={workerToken} onLogout={handleWorkerLogout}/>
      : <WorkerLogin onLogin={handleWorkerAuth}/>,
    "payment-success":<PaymentSuccess onNav={navigate}/>,
    "payment-cancelled":<PaymentCancelled onNav={navigate}/>,
    "terms":<TermsPage onNav={navigate}/>,
    "privacy":<PrivacyPage onNav={navigate}/>,
    "worker-agreement":<WorkerAgreementPage onNav={navigate}/>,
    admin: adminToken
      ? <AdminPortal token={adminToken} onLogout={handleAdminLogout}/>
      : <AdminLogin onLogin={setAdminToken}/>,
  };

  return (
    <div style={{minHeight:"100vh",background:C.navy,color:C.chalk,fontFamily:"'Inter',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`
        button { transition: opacity 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease; }
        button:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        button:active:not(:disabled) { transform: translateY(0); }
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: ${C.amber} !important;
          box-shadow: 0 0 0 3px rgba(255,90,31,0.15);
        }
        @media (max-width: 860px) {
          .temco-grid-3, .temco-grid-4, .temco-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <nav style={{background:C.navy,borderBottom:`1px solid ${C.border}`,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,position:"sticky",top:0,zIndex:100,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div onClick={()=>navigate("home")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
            <div style={{background:C.amber,width:30,height:30,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:C.chalk}}>T</div>
            <div>
              <div style={{fontWeight:900,fontSize:14,letterSpacing:"0.08em",color:C.chalk,lineHeight:1}}>TEMCO</div>
              <div style={{fontSize:9,color:C.muted,letterSpacing:"0.05em",textTransform:"uppercase"}}>Labor Dispatch</div>
            </div>
          </div>
          <div style={{display:"flex",gap:3}}>
            {NAV_LEFT.map(n=>(
              <button key={n.id} onClick={()=>navigate(n.id)} style={{background:page===n.id?C.navyMid:"transparent",color:page===n.id?C.amber:C.muted,border:page===n.id?`1px solid ${C.border}`:"1px solid transparent",padding:"5px 11px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>{n.label}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:3}}>
          {NAV_RIGHT.map(n=>(
            <button key={n.id} onClick={()=>navigate(n.id)} style={{background:page===n.id?C.navyMid:"transparent",color:page===n.id?C.amber:C.muted,border:page===n.id?`1px solid ${C.border}`:"1px solid transparent",padding:"5px 11px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>{n.label}</button>
          ))}
        </div>
      </nav>

      <main>{pages[page]}</main>
    </div>
  );
}
