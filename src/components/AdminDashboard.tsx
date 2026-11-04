"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, CalendarDays, FileText, FolderKanban, Image, Inbox, LogOut, Newspaper, Users } from "lucide-react";
import type { AdminRole } from "@/lib/db-types";

type AdminUserView = { id: string; name: string; email: string; role: AdminRole };
type Resource = "overview" | "articles" | "programs" | "projects" | "events" | "gallery" | "team" | "partners" | "publications" | "testimonials" | "contacts" | "users" | "settings";
type Field = { key: string; label: string; type?: "text" | "textarea" | "url" | "date" | "number" | "select" | "checkbox" | "password"; options?: string[]; required?: boolean; rows?: number };
type Item = Record<string, unknown> & { id: string };
const resourceLabels: Record<Resource, string> = { overview: "Overview", articles: "News and articles", programs: "Programs", projects: "Projects", events: "Events", gallery: "Gallery", team: "Team members", partners: "Partners", publications: "Reports and publications", testimonials: "Testimonials", contacts: "Contact messages", users: "Administrator accounts", settings: "Website settings" };
const resourceIcons: Partial<Record<Resource, typeof Newspaper>> = { articles: Newspaper, programs: BarChart3, projects: FolderKanban, events: CalendarDays, gallery: Image, team: Users, contacts: Inbox, publications: FileText };
const roleResources: Record<AdminRole, readonly Resource[]> = {
  EDITOR: ["articles", "programs", "projects", "events", "gallery", "publications"],
  ADMIN: ["articles", "programs", "projects", "events", "gallery", "team", "partners", "publications", "testimonials", "contacts", "settings"],
  SUPER_ADMIN: ["articles", "programs", "projects", "events", "gallery", "team", "partners", "publications", "testimonials", "contacts", "users", "settings"],
};

const fieldSets: Partial<Record<Resource, Field[]>> = {
  articles: [{key:"title",label:"Article title",required:true},{key:"slug",label:"URL slug",required:true},{key:"summary",label:"Summary",type:"textarea",required:true},{key:"body",label:"Article body",type:"textarea",rows:8,required:true},{key:"category",label:"Category",required:true},{key:"featuredImageUrl",label:"Featured image URL",type:"url"},{key:"seoTitle",label:"SEO title"},{key:"seoDescription",label:"SEO description",type:"textarea"},{key:"featured",label:"Feature on homepage",type:"checkbox"},{key:"status",label:"Publication status",type:"select",options:["DRAFT","PUBLISHED","ARCHIVED"]},{key:"publishAt",label:"Publication date and time (schedule if future)",type:"date"},{key:"tags",label:"Tags (comma-separated)"}],
  programs: [{key:"title",label:"Program title",required:true},{key:"slug",label:"URL slug",required:true},{key:"description",label:"Description",type:"textarea",required:true},{key:"objectives",label:"Objectives (one per line)",type:"textarea",required:true},{key:"activities",label:"Activities (one per line)",type:"textarea",required:true},{key:"imageUrl",label:"Image URL",type:"url"},{key:"status",label:"Publication status",type:"select",options:["DRAFT","PUBLISHED","ARCHIVED"]},{key:"sortOrder",label:"Display order",type:"number"}],
  projects: [{key:"title",label:"Project title",required:true},{key:"slug",label:"URL slug",required:true},{key:"summary",label:"Summary",type:"textarea",required:true},{key:"description",label:"Description",type:"textarea",required:true},{key:"objectives",label:"Objectives (one per line)",type:"textarea",required:true},{key:"location",label:"Location",required:true},{key:"projectStatus",label:"Project stage",required:true},{key:"status",label:"Publication status",type:"select",options:["DRAFT","PUBLISHED","ARCHIVED"]},{key:"imageUrl",label:"Image URL",type:"url"},{key:"beneficiaries",label:"Beneficiaries / target groups",type:"textarea"},{key:"verifiedResults",label:"Verified results only",type:"textarea"},{key:"reportUrl",label:"Project report URL",type:"url"},{key:"startsAt",label:"Start date",type:"date"},{key:"endsAt",label:"End date",type:"date"}],
  events: [{key:"title",label:"Event title",required:true},{key:"slug",label:"URL slug",required:true},{key:"description",label:"Description",type:"textarea",required:true},{key:"location",label:"Location",required:true},{key:"startsAt",label:"Start date and time",type:"date",required:true},{key:"endsAt",label:"End date and time",type:"date"},{key:"imageUrl",label:"Image URL",type:"url"},{key:"status",label:"Publication status",type:"select",options:["DRAFT","PUBLISHED","ARCHIVED"]}],
  gallery: [{key:"title",label:"Image title",required:true},{key:"caption",label:"Caption",type:"textarea"},{key:"altText",label:"Accessible image description",required:true},{key:"category",label:"Category",required:true},{key:"imageUrl",label:"Image URL",type:"url",required:true},{key:"status",label:"Publication status",type:"select",options:["DRAFT","PUBLISHED","ARCHIVED"]},{key:"sortOrder",label:"Display order",type:"number"}],
  team: [{key:"name",label:"Full name",required:true},{key:"position",label:"Position",required:true},{key:"biography",label:"Biography",type:"textarea",required:true},{key:"status",label:"Publication status",type:"select",options:["DRAFT","PUBLISHED","ARCHIVED"]},{key:"sortOrder",label:"Display order",type:"number"}],
  partners: [{key:"name",label:"Organization name",required:true},{key:"websiteUrl",label:"Website URL",type:"url"},{key:"description",label:"Description",type:"textarea"},{key:"logoUrl",label:"Approved logo URL",type:"url"},{key:"status",label:"Publication status",type:"select",options:["DRAFT","PUBLISHED","ARCHIVED"]}],
  publications: [{key:"title",label:"Publication title",required:true},{key:"description",label:"Description",type:"textarea"},{key:"category",label:"Category",required:true},{key:"documentUrl",label:"Document URL",type:"url",required:true},{key:"status",label:"Publication status",type:"select",options:["DRAFT","PUBLISHED","ARCHIVED"]}],
  testimonials: [{key:"quote",label:"Approved testimonial text",type:"textarea",required:true},{key:"authorName",label:"Name",required:true},{key:"authorRole",label:"Role or context",required:true},{key:"category",label:"Category",type:"select",options:["Youth","Community member","Partner"],required:true},{key:"imageUrl",label:"Portrait URL (with consent)",type:"url"},{key:"consentToPublish",label:"Written consent obtained",type:"checkbox"},{key:"approved",label:"Approved for publication",type:"checkbox"}],
  users: [{key:"name",label:"Full name",required:true},{key:"email",label:"Email",required:true},{key:"password",label:"Initial password (at least 12 characters)",type:"password",required:true},{key:"role",label:"Role",type:"select",options:["SUPER_ADMIN","ADMIN","EDITOR"],required:true},{key:"active",label:"Account active",type:"checkbox"}],
  settings: [{key:"key",label:"Setting key",required:true},{key:"value",label:"JSON value",type:"textarea",required:true}],
};

async function requestJson(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(url, { ...init, headers: { ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...init?.headers } });
  const body = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(String(body.error || "Request failed."));
  return body;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function AdminDashboard({ user }: { user: AdminUserView }) {
  const router = useRouter();
  const [active, setActive] = useState<Resource>("overview");
  const [items, setItems] = useState<Item[]>([]);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const fields = useMemo(() => fieldSets[active] ?? [], [active]);

  useEffect(() => {
    if (active === "overview") {
      const resources: Resource[] = ["articles","projects","programs","events","gallery","team","partners","contacts","testimonials","publications","users"];
      Promise.all(resources.filter(resource => roleResources[user.role].includes(resource)).map(async resource => {
        const route = resource === "users" ? "/api/admin/users" : `/api/admin/content/${resource}`;
        const response = await requestJson(route);
        return [resource, resource === "users" ? (response.users as unknown[]).length : Number(response.total || 0)] as const;
      })).then(values => setMetrics(Object.fromEntries(values))).catch(reason => setError(reason instanceof Error ? reason.message : "Dashboard totals could not be loaded."));
      return;
    }
    const route = active === "users" ? "/api/admin/users" : `/api/admin/content/${active}?page=${page}&q=${encodeURIComponent(query)}`;
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled) return null;
        setBusy(true);
        setError("");
        return requestJson(route);
      })
      .then(response => {
        if (!response || cancelled) return;
        const rows = active === "users" ? response.users : response.items;
        if (!Array.isArray(rows)) throw new Error("The server returned an invalid item list.");
        setItems(rows as Item[]);
        setTotal(typeof response.total === "number" ? response.total : rows.length);
      })
      .catch(reason => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Content could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, page, query, user.role]);

  function resetForm(form: HTMLFormElement) {
    form.reset();
    const status = form.elements.namedItem("status");
    if (status instanceof HTMLSelectElement) status.value = active === "programs" ? "PUBLISHED" : "DRAFT";
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries()) as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const field of fields) {
      const value = raw[field.key];
      if (field.type === "checkbox") data[field.key] = value === "on";
      else if (field.type === "number") data[field.key] = value ? Number(value) : 0;
      else if (field.key === "objectives" || field.key === "activities" || field.key === "tags") data[field.key] = String(value || "").split(/[\n,]/).map(part => part.trim()).filter(Boolean);
      else if (field.type === "date") data[field.key] = value ? (field.key.endsWith("At") ? new Date(String(value)).toISOString() : value) : null;
      else if (value !== undefined) data[field.key] = value;
    }
    if (active === "testimonials") data.consentToPublish = raw.consentToPublish === "on";
    try {
      const endpoint = active === "users" ? "/api/admin/users" : `/api/admin/content/${active}`;
      let payload: unknown;
      if (active === "settings") {
        try { data.value = JSON.parse(String(data.value)); } catch { throw new Error("Website setting value must contain valid JSON."); }
      }
      for (const field of fields) {
        const uploadKind = field.key === "documentUrl" ? "document" : ["imageUrl", "featuredImageUrl", "logoUrl"].includes(field.key) ? "image" : null;
        if (!uploadKind) continue;
        const file = raw[`upload_${field.key}`];
        if (!(file instanceof File) || file.size === 0) continue;
        const formData = new FormData();
        formData.set("file", file);
        formData.set("kind", uploadKind);
        const uploaded = await requestJson("/api/admin/upload", { method: "POST", body: formData });
        const asset = uploaded.asset as { url?: unknown } | undefined;
        if (typeof asset?.url !== "string") throw new Error("The media service returned an invalid upload response.");
        data[field.key] = asset.url;
      }
      if (editing) payload = await requestJson(endpoint, { method: "PATCH", body: JSON.stringify(active === "users" ? { id: editing.id, data: { ...data, password: "" } } : { id: editing.id, data }) });
      else payload = await requestJson(endpoint, { method: "POST", body: JSON.stringify(data) });
      resetForm(form);
      setEditing(null);
      const saveResult = payload as { approvalReset?: boolean };
      setMessage(saveResult.approvalReset
        ? "Testimonial details changed. Publication consent and approval must be obtained again."
        : editing ? "Record updated successfully." : "Record created successfully.");
      const route = active === "users" ? "/api/admin/users" : `/api/admin/content/${active}`;
      const updated = await requestJson(active === "users" ? route : `${route}?page=${page}&q=${encodeURIComponent(query)}`);
      const rows = active === "users" ? updated.users : updated.items;
      if (!Array.isArray(rows)) throw new Error("The server returned an invalid item list.");
      setItems(rows as Item[]);
      setTotal(typeof updated.total === "number" ? updated.total : rows.length);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The record could not be saved.");
    } finally { setBusy(false); }
  }

  async function deleteItem(item: Item) {
    if (!window.confirm(`Permanently delete this ${active === "users" ? "administrator" : "record"}?`)) return;
    setError(""); setMessage("");
    try {
      const endpoint = active === "users" ? `/api/admin/users?id=${encodeURIComponent(item.id)}` : `/api/admin/content/${active}?id=${encodeURIComponent(item.id)}`;
      await requestJson(endpoint, { method: "DELETE" });
      setItems(current => current.filter(entry => entry.id !== item.id));
      setTotal(current => Math.max(0, current - 1));
      if (items.length === 1 && page > 1) setPage(current => current - 1);
      setMessage("Record deleted.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The record could not be deleted."); }
  }

  async function updateContact(item: Item, status: string) {
    try {
      await requestJson("/api/admin/content/contacts", { method: "PATCH", body: JSON.stringify({ id: item.id, data: { status } }) });
      setItems(current => current.map(entry => entry.id === item.id ? { ...entry, status } : entry));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The message status could not be changed."); }
  }

  async function exportCurrentPage() {
    setBusy(true); setError("");
    try {
      const offset = (page - 1) * 25;
      const response = await fetch(`/api/admin/content/${active}/export?offset=${offset}&limit=25`);
      if (!response.ok) {
        const body = await response.json() as { error?: string };
        throw new Error(body.error || "The export could not be downloaded.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ypp-${active}-page-${page}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("CSV export downloaded.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The export could not be downloaded.");
    } finally { setBusy(false); }
  }

  async function logout() {
    try { await requestJson("/api/auth/logout", { method: "POST", body: "{}" }); router.replace("/admin/login"); router.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Sign out failed."); }
  }

  const navigation = (Object.keys(resourceLabels) as Resource[]).filter(resource => resource === "overview" || roleResources[user.role].includes(resource));
  return (
    <main className="admin-app">
      <aside className="admin-sidebar"><Link className="admin-logo" href="/"><span className="brand-mark">YPP</span><span>CONTENT CMS<small>ADMIN WORKSPACE</small></span></Link>
        <p className="sidebar-label">WORKSPACE</p>{navigation.map(resource => { const Icon = resourceIcons[resource]; return <button key={resource} className={`admin-nav-item${active === resource ? " is-active" : ""}`} type="button" onClick={() => {setActive(resource);setPage(1);setMessage("");setError("");setEditing(null);}}>{Icon && <Icon size={17} />}{resourceLabels[resource]}</button>; })}
        <button className="admin-logout" type="button" onClick={logout}><LogOut size={17} /> Sign out</button>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar"><div><span className="eyebrow">YPP CONTENT MANAGEMENT</span><h1>{resourceLabels[active]}</h1></div><div className="admin-user"><strong>{user.name}</strong><span>{user.role.replaceAll("_", " ")}</span></div></header>
        <div className="admin-content">
          {error && <p className="notice error" role="alert">{error}</p>}
          {message && <p className="notice success" role="status">{message}</p>}
          {active === "overview" ? <section className="metric-grid">{Object.entries(metrics).map(([key,value]) => <article className="metric-card" key={key}><span>{resourceLabels[key as Resource] || key}</span><strong>{value.toLocaleString()}</strong><small>Live database total</small></article>)}</section> : <>
            <div className="admin-toolbar"><p>Changes are saved to the configured MySQL database.</p><input aria-label="Search records" placeholder="Search title, name, or email" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} />{!["users","settings","contacts"].includes(active) && <button className="button button-quiet" type="button" disabled={busy || items.length === 0} onClick={exportCurrentPage}>Export this page</button>}<button className="button button-primary" type="button" onClick={() => setEditing({ id: "" })}>Add {resourceLabels[active].replace(/s$/, "")}</button></div>
            {editing && fields.length > 0 && <form className="admin-editor" key={`${active}-${editing.id || "new"}`} onSubmit={saveItem}><div className="editor-heading"><h2>{editing.id ? "Edit record" : "Create record"}</h2><button className="button button-quiet" type="button" onClick={() => setEditing(null)}>Cancel</button></div>
              <div className="editor-grid">{fields.map(field => {
                const uploadKind = field.key === "documentUrl" ? "document" : ["imageUrl", "featuredImageUrl", "logoUrl"].includes(field.key) ? "image" : null;
                return <div className={field.type === "textarea" ? "editor-wide" : ""} key={field.key}>
                  <label>{field.label}{field.type === "textarea" ? <textarea name={field.key} rows={field.rows ?? 4} required={field.required} defaultValue={formatInitial(field, editing[field.key])} /> : field.type === "select" ? <select name={field.key} required={field.required} defaultValue={String(editing[field.key] ?? field.options?.[0] ?? "")}>{field.options?.map(option => <option value={option} key={option}>{option.replaceAll("_"," ")}</option>)}</select> : field.type === "checkbox" ? <input className="checkbox-input" name={field.key} type="checkbox" defaultChecked={editing[field.key] === true || (!editing.id && field.key === "active")} /> : <input name={field.key} type={field.type === "date" && field.key.endsWith("At") ? "datetime-local" : field.type ?? "text"} required={field.key === "password" ? !editing.id && Boolean(field.required) : Boolean(field.required && !uploadKind)} defaultValue={formatInitial(field, editing[field.key === "publishAt" ? "publishedAt" : field.key])} />}</label>
                  {uploadKind && <label className="upload-field">Or upload {uploadKind === "document" ? "a PDF" : "an image"}<input name={`upload_${field.key}`} type="file" accept={uploadKind === "document" ? "application/pdf,.pdf" : "image/jpeg,image/png,image/webp"} /></label>}
                </div>;
              })}</div>
              <button className="button button-primary" disabled={busy} type="submit">{busy ? "Saving…" : "Save to database"}</button>
            </form>}
            {active === "testimonials" && <p className="privacy-note">Testimonials stay private unless the person has given explicit written consent and an authorized administrator approves publication.</p>}
            {busy ? <p className="muted">Loading database records…</p> : items.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Record</th><th>Status</th><th>Last updated</th><th>Actions</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{displayValue(item.title ?? item.name ?? item.authorName ?? item.key ?? item.subject)}</strong><small>{displayValue(item.slug ?? item.email ?? item.position ?? item.category ?? item.message)}</small></td><td>{displayValue(item.status ?? (item.approved ? "APPROVED" : item.consentToPublish === false ? "PENDING CONSENT" : "—"))}</td><td>{displayValue(item.updatedAt ?? item.createdAt)}</td><td className="table-actions">{active === "contacts" ? <select aria-label="Update contact message status" value={String(item.status)} onChange={event => updateContact(item,event.target.value)}><option>UNREAD</option><option>READ</option><option>REPLIED</option><option>ARCHIVED</option></select> : <button className="button button-quiet" type="button" onClick={() => setEditing(item)}>Edit</button>}<button className="button button-danger" type="button" onClick={() => deleteItem(item)}>Delete</button></td></tr>)}</tbody></table></div> : !editing && <div className="empty-panel"><h2>No records yet</h2><p>Items you create here will be stored in the production database.</p></div>}
            {active !== "users" && total > 25 && <nav className="pagination" aria-label="Admin records pagination"><button className="button button-quiet" type="button" disabled={page <= 1 || busy} onClick={() => setPage(current => current - 1)}>Previous</button><span>Page {page} of {Math.ceil(total / 25)} · {total} records</span><button className="button button-quiet" type="button" disabled={page >= Math.ceil(total / 25) || busy} onClick={() => setPage(current => current + 1)}>Next</button></nav>}
          </>}
        </div>
      </section>
    </main>
  );
}

function formatInitial(field: Field, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join("\n");
  if (field.type === "date" && field.key.endsWith("At")) {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
