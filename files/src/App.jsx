import { useState, useMemo, useEffect } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE = "https://temco-backend-production.up.railway.app";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  navy: "#0B1220", navyMid: "#141D30", navyLight: "#1E2D47",
  amber: "#F5A623", amberDim: "#C4841C",
  green: "#22C55E", red: "#EF4444", blue: "#60A5FA",
  chalk: "#F0EDE8", muted: "#8A96A8", border: "#243044",
};

const SKILL_TYPES = ["Loading","Unloading","Packing","Inventory","Assembly","Class A Driver","Crew Lead","Driving","Shuttle","Crating","Delivery"];

// ─── MOCK JOBS (kept as fallback/demo data for public-facing pages) ──────────
const INITIAL_JOBS = [
  { id:"JOB-1041", customer:"Two Men and a Truck – Dallas", location:"Dallas, TX", date:"Jun 12, 2026", time:"8:00 AM", crew:4, type:"Load/Unload", status:"Confirmed", fee:400, workerIds:[] },
  { id:"JOB-1040", customer:"Atlas Van Lines", location:"Houston, TX", date:"Jun 11, 2026", time:"9:00 AM", crew:3, type:"Packing", status:"In Progress", fee:300, workerIds:[] },
  { id:"JOB-1039", customer:"U-Pack Brokers", location:"Phoenix, AZ", date:"Jun 10, 2026", time:"7:00 AM", crew:2, type:"Loading", status:"Completed", fee:200, workerIds:[] },
  { id:"JOB-1038", customer:"Mayflower Transit", location:"Chicago, IL", date:"Jun 9, 2026", time:"8:00 AM", crew:5, type:"Full Service", status:"Completed", fee:500, workerIds:[] },
  { id:"JOB-1042", customer:"Allied Van Lines", location:"Atlanta, GA", date:"Jun 13, 2026", time:"7:30 AM", crew:4, type:"Load/Unload", status:"Pending", fee:400, workerIds:[] },
];

// Fallback states list used only before live data has loaded
const FALLBACK_STATES = ["AL","AR","AZ","CA","CO","FL","GA","IL","TX","NC","VA","NV","WA","OR","NY","OH","TN","PA","MN","MO","MI"];

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const field = {
  width:"100%", background:C.navyMid, border:`1px solid ${C.border}`,
  borderRadius:8, padding:"11px 14px", color:C.chalk, fontSize:14,
  outline:"none", boxSizing:"border-box", fontFamily:"inherit"
};
const label = { fontSize:11, color:C.muted, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:5, display:"block" };
const btn = (variant="primary") => ({
  background: variant==="primary" ? C.amber : variant==="ghost" ? "transparent" : C.navyLight,
  color: variant==="primary" ? C.navy : C.chalk,
  border: variant==="ghost" ? `1px solid ${C.border}` : "none",
  padding:"10px 20px", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer"
});

function Badge({ status }) {
  const map = {
    Available:{bg:"#163B2A",color:C.green}, Pending:{bg:"#1C1F2E",color:C.blue}, pending:{bg:"#1C1F2E",color:C.blue},
    "On Job":{bg:"#1A2E0A",color:"#86EFAC"}, Unavailable:{bg:"#2A1A1A",color:C.red},
    Confirmed:{bg:"#163B2A",color:C.green}, "In Progress":{bg:"#1A2500",color:C.amber},
    Completed:{bg:"#1A1A2E",color:C.muted}, Active:{bg:"#163B2A",color:C.green}, active:{bg:"#163B2A",color:C.green},
  };
  const s = map[status] || {bg:"#222",color:"#aaa"};
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
          background:active===k?C.amber:"transparent",color:active===k?C.navy:C.muted
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

// ─── PUBLIC HOME ──────────────────────────────────────────────────────────────
function PublicHome({ onNav, workerCount, stateCount }) {
  return (
    <div>
      {/* Hero */}
      <div style={{background:`linear-gradient(150deg,${C.navy} 0%,${C.navyMid} 100%)`,padding:"72px 40px 56px",textAlign:"center",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(245,166,35,0.12)",border:`1px solid ${C.amber}33`,padding:"4px 14px",borderRadius:20,marginBottom:20}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:C.green,display:"inline-block"}}/>
          <span style={{fontSize:11,fontWeight:700,color:C.amber,letterSpacing:"0.1em",textTransform:"uppercase"}}>Now Dispatching Nationwide</span>
        </div>
        <h1 style={{fontSize:"clamp(34px,5.5vw,60px)",fontWeight:900,color:C.chalk,lineHeight:1.05,margin:"0 0 18px",maxWidth:680,marginLeft:"auto",marginRight:"auto"}}>
          Moving Labor.<br/><span style={{color:C.amber}}>Any City.</span> Within Minutes.
        </h1>
        <p style={{fontSize:17,color:C.muted,maxWidth:500,margin:"0 auto 36px",lineHeight:1.6}}>
          TEMCO connects moving companies, carriers, and brokers with vetted crews anywhere in the US — automated, dispatched, confirmed.
        </p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>onNav("request")} style={{background:C.amber,color:C.navy,border:"none",padding:"14px 32px",borderRadius:8,fontSize:15,fontWeight:800,cursor:"pointer"}}>Request Labor Now →</button>
          <button onClick={()=>onNav("worker-signup")} style={{background:"transparent",color:C.chalk,border:`1px solid ${C.border}`,padding:"14px 28px",borderRadius:8,fontSize:15,fontWeight:600,cursor:"pointer"}}>Become a Helper</button>
        </div>
        {/* Live stats bar */}
        <div style={{display:"flex",gap:32,justifyContent:"center",marginTop:48,flexWrap:"wrap"}}>
          {[
            {val:`${workerCount}+`, lbl:"Vetted Workers"},
            {val:`${stateCount}`, lbl:"States Covered"},
            {val:"< 10 min", lbl:"Avg. Dispatch Time"},
            {val:"97%", lbl:"Fill Rate"},
          ].map(s=>(
            <div key={s.lbl} style={{textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:900,color:C.amber}}>{s.val}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{padding:"56px 40px",maxWidth:900,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{fontSize:11,color:C.amber,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>The Process</div>
          <h2 style={{fontSize:28,fontWeight:800,color:C.chalk,margin:0}}>From Request to Confirmed Crew in Minutes</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:16}}>
          {[
            {step:"01",title:"Submit Request",desc:"Enter job location, date, crew size, and type of work needed."},
            {step:"02",title:"AI Matches Crew",desc:"System ranks nearby workers by distance, skill, certifications, and reliability."},
            {step:"03",title:"SMS Dispatch",desc:"Workers get a text instantly. YES/NO replies are tracked in real time."},
            {step:"04",title:"Crew Confirmed",desc:"You receive worker names, phones, crew lead — ready to roll."},
          ].map(s=>(
            <div key={s.step} style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
              <div style={{fontSize:28,fontWeight:900,color:C.amber,opacity:0.35,fontFamily:"monospace"}}>{s.step}</div>
              <div style={{fontSize:15,fontWeight:700,color:C.chalk,margin:"8px 0 6px"}}>{s.title}</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div style={{background:C.navyMid,padding:"56px 40px",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:560,margin:"0 auto",textAlign:"center"}}>
          <h2 style={{fontSize:26,fontWeight:800,color:C.chalk,margin:"0 0 8px"}}>Simple, Transparent Pricing</h2>
          <p style={{color:C.muted,marginBottom:32}}>One flat dispatch fee per worker. You pay workers directly on-site.</p>
          <div style={{background:C.navy,border:`1px solid ${C.border}`,borderRadius:14,padding:"32px 40px",display:"inline-block"}}>
            <div style={{fontSize:48,fontWeight:900,color:C.amber}}>$75–$125</div>
            <div style={{color:C.muted,fontSize:14,marginTop:4}}>per worker dispatched</div>
            <div style={{marginTop:20,color:C.chalk,opacity:0.7,fontSize:13,lineHeight:1.8}}>
              TEMCO never processes worker payroll.<br/>You pay workers directly on-site at your rate.
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{padding:"32px 40px",textAlign:"center",color:C.muted,fontSize:12}}>
        <div style={{display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap",marginBottom:12}}>
          <span style={{cursor:"pointer"}} onClick={()=>onNav("terms")}>Terms of Service</span>
          <span style={{cursor:"pointer"}} onClick={()=>onNav("privacy")}>Privacy Policy</span>
          <span style={{cursor:"pointer"}} onClick={()=>onNav("worker-agreement")}>Worker Agreement</span>
          <span style={{cursor:"pointer"}}>Contact: (347) 835-4479</span>
        </div>
        © 2026 The Empire Moving Co., LLC d/b/a TEMCO National Labor Dispatch Network. All rights reserved.
      </div>
    </div>
  );
}

// ─── REQUEST FORM ─────────────────────────────────────────────────────────────
function RequestForm({ onNav, addJob, states }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({company:"",contact:"",phone:"",email:"",password:"",location:"",state:"",zip:"",date:"",time:"",crew:"4",type:"Load/Unload",duration:"4",notes:""});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdJob, setCreatedJob] = useState(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const up = (k,v) => setForm(p=>({...p,[k]:v}));

  const handlePayment = async () => {
    setPayLoading(true);
    setPayError("");
    try {
      const res = await fetch(`${API_BASE}/api/payments/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      } else if (!registerRes.ok) {
        setSubmitError("Could not create your account. Please check your details and try again.");
        setSubmitting(false);
        return;
      } else {
        token = (await registerRes.json()).token;
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
            <div><label style={label}>Date</label><input type="date" style={field} value={form.date} onChange={e=>up("date",e.target.value)}/></div>
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
          <div><label style={label}>Special Requirements</label><textarea style={{...field,resize:"vertical",minHeight:72}} value={form.notes} onChange={e=>up("notes",e.target.value)} placeholder="Stairs, heavy items, military base access needed..."/></div>
        </div>
      )}

      {step===3 && (
        <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:14}}>Order Summary</div>
          {[["Company",form.company],["Contact",form.contact],["Location",`${form.location}, ${form.state}`],["Date & Time",`${form.date} at ${form.time}`],["Crew Size",`${form.crew} workers`],["Work Type",form.type],["Duration",`${form.duration} hrs`]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.muted,fontSize:13}}>{k}</span>
              <span style={{color:C.chalk,fontSize:13,fontWeight:600}}>{v||"—"}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:14,marginTop:4}}>
            <span style={{color:C.chalk,fontWeight:700}}>Dispatch Fee</span>
            <span style={{color:C.amber,fontWeight:900,fontSize:22}}>${parseInt(form.crew||0)*100}</span>
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
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const up = (k,v) => setForm(p=>({...p,[k]:v}));
  const toggleSkill = s => setForm(p=>({...p,skills:p.skills.includes(s)?p.skills.filter(x=>x!==s):[...p.skills,s]}));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/workers/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
                color:form.skills.includes(s)?C.navy:C.muted,
                border:`1px solid ${form.skills.includes(s)?C.amber:C.border}`
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div><label style={label}>Notes / Equipment / Crew Size</label><textarea style={{...field,resize:"vertical",minHeight:72}} value={form.notes} onChange={e=>up("notes",e.target.value)} placeholder="Own tools, dollies, travel radius, crew size..."/></div>
        <div style={{display:"flex",alignItems:"flex-start",gap:10,marginTop:4}}>
          <input type="checkbox" id="worker-tos" style={{marginTop:2,accentColor:C.amber,width:16,height:16,flexShrink:0}} required/>
          <label htmlFor="worker-tos" style={{fontSize:12,color:C.muted,lineHeight:1.5,cursor:"pointer"}}>
            I agree to TEMCO's <span style={{color:C.amber}}>Worker Agreement</span> and understand I am joining as an independent contractor. I consent to receive automated SMS job offers from TEMCO. Reply STOP to any message to opt out.
          </label>
        </div>
        {error && <div style={{color:C.red,fontSize:12}}>{error}</div>}
        <button onClick={handleSubmit} disabled={submitting} style={{...btn(),padding:"13px",fontSize:14,marginTop:4,opacity:submitting?0.6:1}}>
          {submitting ? "Submitting..." : "Submit Application →"}
        </button>
      </div>
    </div>
  );
}

// ─── CUSTOMER PORTAL ──────────────────────────────────────────────────────────
function CustomerPortal({ jobs }) {
  const [tab, setTab] = useState("jobs");
  const myJobs = jobs.slice(0,4);
  const totalSpend = myJobs.reduce((a,j)=>a+j.fee,0);

  return (
    <div style={{padding:"30px"}}>
      <SectionTitle title="Customer Portal" sub="Track jobs, manage crews, and view invoices." />
      <Tabs tabs={[["jobs","My Jobs"],["billing","Invoices"],["request","New Request"]]} active={tab} onChange={setTab}/>

      {tab==="jobs" && (
        <>
          <div style={{display:"flex",gap:14,marginBottom:24,flexWrap:"wrap"}}>
            <StatCard label="Total Jobs" value={myJobs.length} />
            <StatCard label="Active" value={myJobs.filter(j=>j.status==="In Progress"||j.status==="Confirmed").length} color={C.amber}/>
            <StatCard label="Total Spent" value={`$${totalSpend.toLocaleString()}`} color={C.green}/>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                {["Job ID","Location","Date","Crew","Type","Fee","Status"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"9px 12px",color:C.muted,fontWeight:700,fontSize:10,textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{myJobs.map(j=>(
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
        </>
      )}

      {tab==="billing" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {myJobs.map(j=>(
            <div key={j.id} style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:10,padding:"15px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{fontWeight:700,color:C.chalk}}>{j.id} — {j.location}</div>
                <div style={{fontSize:12,color:C.muted}}>{j.date} · {j.crew} workers · {j.type}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:18,fontWeight:800,color:C.amber}}>${j.fee}</span>
                <Badge status={j.status==="Completed"?"Completed":"Confirmed"}/>
                <button style={{...btn("secondary"),fontSize:11,padding:"5px 12px"}}>Receipt</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="request" && <RequestForm onNav={()=>setTab("jobs")} addJob={()=>{}} states={FALLBACK_STATES} />}
    </div>
  );
}

// ─── WORKER PORTAL ────────────────────────────────────────────────────────────
function WorkerPortal() {
  const [avail, setAvail] = useState(true);
  const [responded, setResponded] = useState(null);

  return (
    <div style={{padding:"30px"}}>
      <SectionTitle title="Worker Portal" sub="Manage your profile, availability, and job offers." />
      <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:22,flexWrap:"wrap"}}>
        {/* Profile card */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
            <div style={{width:54,height:54,borderRadius:"50%",background:C.amber,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:C.navy,marginBottom:14}}>
              MJ
            </div>
            <div style={{fontWeight:800,fontSize:17,color:C.chalk}}>Sample Worker</div>
            <div style={{fontSize:13,color:C.muted,marginTop:2}}>Log in via SMS link to see your real profile</div>
          </div>
          {/* Availability toggle */}
          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Availability</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{color:avail?C.green:C.red,fontWeight:700,fontSize:14}}>{avail?"Available":"Unavailable"}</span>
              <div onClick={()=>setAvail(a=>!a)} style={{width:44,height:24,borderRadius:12,cursor:"pointer",background:avail?C.green:C.border,position:"relative",transition:"background 0.2s"}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,left:avail?23:3,transition:"left 0.2s"}}/>
              </div>
            </div>
          </div>
        </div>

        {/* SMS job offer preview */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
            <div style={{fontWeight:700,color:C.chalk,marginBottom:4}}>Incoming Job Offer</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:16}}>This is how TEMCO dispatch texts will appear on your phone</div>
            <div style={{background:"#0D1B2A",border:`1px solid ${C.border}`,borderRadius:12,padding:20,fontFamily:"monospace",fontSize:13,color:"#CBD5E1",lineHeight:2}}>
              <div style={{color:C.muted,fontSize:11,marginBottom:8}}>From: TEMCO Dispatch · {new Date().toLocaleTimeString()}</div>
              🚛 Job Offer — TEMCO Dispatch<br/>
              ─────────────────────<br/>
              📍 Dallas, TX 75201<br/>
              📅 Jun 12 @ 8:00 AM<br/>
              👥 4 Loaders needed<br/>
              ⏱ Est. 4 hours<br/>
              💵 Pay: $150–200 (cash on-site)<br/>
              ─────────────────────<br/>
              Reply YES to confirm<br/>
              Reply NO to decline<br/>
              Reply STOP to opt out
            </div>
            {!responded ? (
              <div style={{display:"flex",gap:10,marginTop:16}}>
                <button onClick={()=>setResponded("yes")} style={{flex:1,background:C.green,color:"white",border:"none",padding:"11px",borderRadius:8,fontWeight:800,cursor:"pointer",fontSize:14}}>✓ YES — Accept Job</button>
                <button onClick={()=>setResponded("no")} style={{flex:1,background:C.navyLight,color:C.muted,border:`1px solid ${C.border}`,padding:"11px",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14}}>✗ NO — Decline</button>
              </div>
            ) : (
              <div style={{marginTop:16,padding:14,borderRadius:8,background:responded==="yes"?"#163B2A":"#2A1A1A",color:responded==="yes"?C.green:C.red,fontWeight:700,textAlign:"center"}}>
                {responded==="yes"?"✓ Confirmed! You'll receive full job details shortly.":"✗ Declined. We'll send you the next available job."}
              </div>
            )}
          </div>

          {/* How it works for workers */}
          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
            <div style={{fontWeight:700,color:C.chalk,marginBottom:14}}>How TEMCO Works for You</div>
            {[
              ["1","Get job offers by text","No app needed. Offers come straight to your phone."],
              ["2","Reply YES or NO","Simple one-word reply. System handles the rest."],
              ["3","Show up and get paid","Customer pays you directly on-site at the agreed rate."],
            ].map(([n,t,d])=>(
              <div key={n} style={{display:"flex",gap:12,marginBottom:14}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:C.amber,color:C.navy,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,flexShrink:0}}>{n}</div>
                <div>
                  <div style={{color:C.chalk,fontWeight:600,fontSize:13}}>{t}</div>
                  <div style={{color:C.muted,fontSize:12,marginTop:2}}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
        // Backend may return either a raw array or { workers: [...], total }
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

  // Normalize fields since the live DB schema differs slightly from old mock shape
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
    fee: parseFloat(j.dispatch_fee) || 0,
  })), [liveJobs]);

  const totalFees = normalizedJobs.reduce((a,j)=>a+(j.fee||0),0);

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
        <div style={{background:"#2A1A1A",border:`1px solid ${C.red}55`,borderRadius:10,padding:"12px 16px",marginBottom:20,color:C.red,fontSize:13}}>
          {[loadError, jobsLoadError].filter(Boolean).join(" ")} — showing what data is available below.
        </div>
      )}

      <Tabs tabs={[["overview","Overview"],["workers","Workers"],["jobs","All Jobs"],["dispatch","Dispatch Sim"]]} active={tab} onChange={setTab}/>

      {(loading || jobsLoading) ? <Spinner/> : (
      <>
      {/* ── OVERVIEW ── */}
      {tab==="overview" && (
        <div>
          <div style={{display:"flex",gap:14,marginBottom:24,flexWrap:"wrap"}}>
            <StatCard label="Workers in Network" value={normalizedWorkers.length} color={C.green} sub={`${STATES.length} states`}/>
            <StatCard label="Active Jobs" value={normalizedJobs.filter(j=>j.status==="In Progress"||j.status==="Confirmed"||j.status==="Pending").length} color={C.amber}/>
            <StatCard label="Revenue (MTD)" value={`$${totalFees.toLocaleString()}`} color={C.chalk}/>
            <StatCard label="Fill Rate" value="97%" color={C.green}/>
          </div>

          {/* Live jobs */}
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

          {/* Workers by state */}
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

      {/* ── WORKERS ── */}
      {tab==="workers" && (
        <div>
          <div style={{display:"flex",gap:14,marginBottom:20,flexWrap:"wrap"}}>
            <StatCard label="Total Workers" value={normalizedWorkers.length} sub={`${STATES.length} states covered`}/>
            <StatCard label="With Crew/Team" value={normalizedWorkers.filter(w=>w.crew).length} color={C.amber}/>
            <StatCard label="Military Base Access" value={normalizedWorkers.filter(w=>w.bases).length} color={C.green}/>
            <StatCard label="Active Status" value={normalizedWorkers.filter(w=>w.status==="active").length} color={C.blue}/>
          </div>

          {/* Filters */}
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

          <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Showing {filteredWorkers.length} of {normalizedWorkers.length} workers</div>

          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                {["Name","Location","Phone","Certifications","Notes","Status"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"9px 12px",color:C.muted,fontWeight:700,fontSize:10,textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{filteredWorkers.slice(0,100).map(w=>(
                <tr key={w.id} style={{borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:"11px 12px"}}>
                    <div style={{color:C.chalk,fontWeight:600}}>{w.name}</div>
                    {w.experience && <div style={{fontSize:10,color:C.amber}}>{w.experience} exp</div>}
                  </td>
                  <td style={{padding:"11px 12px",color:C.chalk}}>{w.city}{w.city && w.state ? ", " : ""}{w.state}</td>
                  <td style={{padding:"11px 12px",color:C.muted,fontSize:12}}>{w.phone}</td>
                  <td style={{padding:"11px 12px",color:C.muted,fontSize:11}}>{w.certifications ? (w.certifications.slice(0,28) + (w.certifications.length>28?"...":"")) : "—"}</td>
                  <td style={{padding:"11px 12px",color:C.muted,fontSize:11}}>{w.comments ? (w.comments.slice(0,40) + (w.comments.length>40?"...":"")) : "—"}</td>
                  <td style={{padding:"11px 12px"}}><Badge status={w.status}/></td>
                </tr>
              ))}</tbody>
            </table>
            {filteredWorkers.length>100 && <div style={{padding:14,color:C.muted,fontSize:12,textAlign:"center"}}>Showing first 100 results. Refine filters to narrow down.</div>}
            {filteredWorkers.length===0 && !loading && <div style={{padding:30,color:C.muted,fontSize:13,textAlign:"center"}}>No workers match these filters.</div>}
          </div>
        </div>
      )}

      {/* ── ALL JOBS ── */}
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
              {/* Job row — click to expand */}
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

              {/* Expanded panel */}
              {expandedJobId===j.rawId && (
                <div style={{borderTop:`1px solid ${C.border}`,padding:"18px 18px"}}>
                  {/* Action buttons */}
                  <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                    <button onClick={()=>handleReleaseCrewManually(j.rawId)} disabled={!!actionLoading[j.rawId]} style={{background:C.green,color:"white",border:"none",padding:"8px 16px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",opacity:actionLoading[j.rawId]?0.6:1}}>
                      📤 Release Crew to Customer
                    </button>
                    <button onClick={()=>handleRedispatch(j.rawId)} disabled={!!actionLoading[j.rawId]} style={{background:C.blue,color:"white",border:"none",padding:"8px 16px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",opacity:actionLoading[j.rawId]?0.6:1}}>
                      🔄 Re-Dispatch More Workers
                    </button>
                  </div>

                  {/* Action result */}
                  {actionResults[j.rawId] && (
                    <div style={{fontSize:12,color:actionResults[j.rawId].startsWith("✓")?C.green:actionResults[j.rawId].startsWith("⚠")?C.amber:C.red,marginBottom:14,padding:"8px 14px",background:C.navyLight,borderRadius:6,fontWeight:600}}>
                      {actionResults[j.rawId]}
                    </div>
                  )}

                  {/* Workers */}
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
                            background:w.response==='YES'?"#163B2A":w.response==='NO'?"#2A1A1A":w.no_show?"#2A1A1A":"#1A1A2E",
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


      {/* ── DISPATCH SIM ── */}
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
                    background:responses[w.id]==="YES"?"#163B2A":responses[w.id]==="BACKUP"?"#1A2030":"#2A1A1A",
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
            <div style={{marginTop:16,padding:14,background:"#163B2A",borderRadius:8,color:C.green,fontWeight:700,fontSize:13}}>
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
      {para("TEMCO charges a flat dispatch fee of $75–$125 per Helper dispatched. This fee is charged via Stripe upon crew confirmation.")}
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
      {section("SMS & TCPA Compliance")}
      {para("By joining TEMCO, you consent to receive automated SMS messages. Message and data rates may apply. Reply STOP to opt out at any time. Reply START to re-enroll.")}
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
      <h2 style={{fontSize:24,fontWeight:800,color:C.chalk,marginBottom:8}}>Payment Confirmed!</h2>
      <p style={{color:C.muted,lineHeight:1.7,marginBottom:28}}>
        Your dispatch fee has been received. You'll receive a text shortly with your crew details — names, phone numbers, and your crew lead. They're on their way.
      </p>
      <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:24}}>
        <div style={{fontSize:13,color:C.muted,lineHeight:1.8}}>
          <div>✓ Payment processed</div>
          <div>✓ Crew assigned and confirmed</div>
          <div>✓ Worker info sent to your phone</div>
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
export default function App() {
  const [page, setPage] = useState("home");
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [adminToken, setAdminToken] = useState(null);

  // Detect Stripe redirect on mount
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    if (path.includes("payment-success")) setPage("payment-success");
    else if (path.includes("payment-cancelled")) setPage("payment-cancelled");
  }, []);

  const addJob = (job) => setJobs(prev => [job, ...prev]);

  const handleAdminLogout = () => {
    setAdminToken(null);
    setPage("home");
  };

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
    home:<PublicHome onNav={setPage} workerCount={546} stateCount={49}/>,
    request:<RequestForm onNav={setPage} addJob={addJob} states={FALLBACK_STATES}/>,
    "worker-signup":<WorkerSignup states={FALLBACK_STATES}/>,
    "customer-portal":<CustomerPortal jobs={jobs}/>,
    "worker-portal":<WorkerPortal/>,
    "payment-success":<PaymentSuccess onNav={setPage}/>,
    "payment-cancelled":<PaymentCancelled onNav={setPage}/>,
    "terms":<TermsPage onNav={setPage}/>,
    "privacy":<PrivacyPage onNav={setPage}/>,
    "worker-agreement":<WorkerAgreementPage onNav={setPage}/>,
    admin: adminToken
      ? <AdminPortal jobs={jobs} token={adminToken} onLogout={handleAdminLogout}/>
      : <AdminLogin onLogin={setAdminToken}/>,
  };

  return (
    <div style={{minHeight:"100vh",background:C.navy,color:C.chalk,fontFamily:"'Space Grotesk','Inter',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>

      {/* Nav */}
      <nav style={{background:C.navy,borderBottom:`1px solid ${C.border}`,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,position:"sticky",top:0,zIndex:100,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div onClick={()=>setPage("home")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
            <div style={{background:C.amber,width:30,height:30,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:C.navy}}>T</div>
            <div>
              <div style={{fontWeight:900,fontSize:14,letterSpacing:"0.08em",color:C.chalk,lineHeight:1}}>TEMCO</div>
              <div style={{fontSize:9,color:C.muted,letterSpacing:"0.05em",textTransform:"uppercase"}}>Labor Dispatch</div>
            </div>
          </div>
          <div style={{display:"flex",gap:3}}>
            {NAV_LEFT.map(n=>(
              <button key={n.id} onClick={()=>setPage(n.id)} style={{background:page===n.id?C.navyMid:"transparent",color:page===n.id?C.amber:C.muted,border:page===n.id?`1px solid ${C.border}`:"1px solid transparent",padding:"5px 11px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>{n.label}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:3}}>
          {NAV_RIGHT.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} style={{background:page===n.id?C.navyMid:"transparent",color:page===n.id?C.amber:C.muted,border:page===n.id?`1px solid ${C.border}`:"1px solid transparent",padding:"5px 11px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>{n.label}</button>
          ))}
        </div>
      </nav>

      <main>{pages[page]}</main>
    </div>
  );
}
