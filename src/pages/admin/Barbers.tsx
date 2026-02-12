import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Save, Upload, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BarberRow {
  id: string;
  name: string;
  specialty: string | null;
  avatar_url: string | null;
  active: boolean;
  sort_order: number;
}

const emptyForm = { name: "", specialty: "", avatar_url: "", active: true, sort_order: 0 };

const Barbers = () => {
  const [barbers, setBarbers] = useState<BarberRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchBarbers(); }, []);

  const fetchBarbers = async () => {
    const { data } = await supabase.from("barbers").select("*").order("sort_order");
    setBarbers((data as BarberRow[]) || []);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `barber-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("service-images").upload(fileName, file);
    if (error) { toast.error("Erro ao enviar imagem"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("service-images").getPublicUrl(fileName);
    setForm({ ...form, avatar_url: urlData.publicUrl });
    setUploading(false);
    toast.success("Foto enviada!");
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Informe o nome do barbeiro"); return; }
    const payload = {
      name: form.name,
      specialty: form.specialty || null,
      avatar_url: form.avatar_url || null,
      active: form.active,
      sort_order: form.sort_order,
    };

    if (editing) {
      const { error } = await supabase.from("barbers").update(payload).eq("id", editing);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Barbeiro atualizado!");
    } else {
      const { error } = await supabase.from("barbers").insert(payload);
      if (error) { toast.error("Erro ao criar"); return; }
      toast.success("Barbeiro adicionado!");
    }
    setShowModal(false); setEditing(null); setForm(emptyForm); fetchBarbers();
  };

  const handleEdit = (b: BarberRow) => {
    setForm({ name: b.name, specialty: b.specialty || "", avatar_url: b.avatar_url || "", active: b.active, sort_order: b.sort_order });
    setEditing(b.id); setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este barbeiro?")) return;
    const { error } = await supabase.from("barbers").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Barbeiro excluído!"); fetchBarbers();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Barbeiros</h2>
        <button onClick={() => { setForm(emptyForm); setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
          style={{ background: 'hsl(245 60% 55%)', color: 'white' }}>
          <Plus className="w-4 h-4" /> Novo Barbeiro
        </button>
      </div>

      <div className="grid gap-3">
        {barbers.map((b) => (
          <motion.div key={b.id} layout className="glass-card p-4 flex items-center gap-4">
            {b.avatar_url ? (
              <img src={b.avatar_url} alt={b.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center font-bold text-lg"
                style={{ background: 'hsl(245 60% 55% / 0.12)', color: 'hsl(245 60% 65%)' }}>
                {b.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{b.name}</h3>
                {!b.active && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'hsl(0 60% 50% / 0.15)', color: 'hsl(0 60% 65%)' }}>Inativo</span>}
              </div>
              <p className="text-xs text-muted-foreground">{b.specialty || "Sem especialidade"}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => handleEdit(b)} className="p-2 rounded-lg" style={{ background: 'hsl(0 0% 100% / 0.05)' }}>
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={() => handleDelete(b.id)} className="p-2 rounded-lg" style={{ background: 'hsl(0 60% 50% / 0.1)' }}>
                <Trash2 className="w-4 h-4" style={{ color: 'hsl(0 60% 60%)' }} />
              </button>
            </div>
          </motion.div>
        ))}
        {barbers.length === 0 && (
          <div className="glass-card p-8 text-center"><p className="text-sm text-muted-foreground">Nenhum barbeiro cadastrado</p></div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card-strong w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">{editing ? "Editar Barbeiro" : "Novo Barbeiro"}</h3>
                <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  {form.avatar_url ? (
                    <div className="relative">
                      <img src={form.avatar_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                      <button onClick={() => setForm({ ...form, avatar_url: "" })} className="absolute -top-1 -right-1 p-0.5 rounded-full" style={{ background: 'hsl(0 60% 50%)' }}>
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: 'hsl(0 0% 100% / 0.05)' }}>
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'hsl(0 0% 100% / 0.05)', border: '1px solid hsl(0 0% 100% / 0.08)', color: 'hsl(0 0% 70%)' }}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Enviando..." : "Upload Foto"}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Nome *</label>
                  <input className="glass-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Carlos" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Especialidade</label>
                  <input className="glass-input" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Ex: Cortes clássicos" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ativo</label>
                  <button onClick={() => setForm({ ...form, active: !form.active })}
                    className="w-10 h-6 rounded-full transition-all duration-200 relative"
                    style={{ background: form.active ? 'hsl(245 60% 55%)' : 'hsl(0 0% 100% / 0.1)' }}>
                    <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200" style={{ left: form.active ? '22px' : '2px' }} />
                  </button>
                </div>
              </div>
              <button onClick={handleSave} className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                style={{ background: 'hsl(245 60% 55%)', color: 'white' }}>
                <Save className="w-4 h-4" /> {editing ? "Atualizar" : "Adicionar"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Barbers;
