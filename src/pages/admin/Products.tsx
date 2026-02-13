import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Save, Upload, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProductRow {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  active: boolean;
  sort_order: number;
}

const emptyForm = { title: "", description: "", price: 0, image_url: "", active: true, sort_order: 0 };

const Products = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("sort_order");
    setProducts((data as ProductRow[]) || []);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("service-images").upload(fileName, file);
    if (error) { toast.error("Erro ao fazer upload"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("service-images").getPublicUrl(fileName);
    setForm({ ...form, image_url: urlData.publicUrl });
    setUploading(false);
    toast.success("Imagem enviada!");
  };

  const handleSave = async () => {
    if (!form.title || form.price <= 0) { toast.error("Preencha todos os campos obrigatórios"); return; }
    const payload = {
      title: form.title,
      description: form.description || null,
      price: form.price,
      image_url: form.image_url || null,
      active: form.active,
      sort_order: form.sort_order,
    };

    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Produto atualizado!");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast.error("Erro ao criar"); return; }
      toast.success("Produto criado!");
    }
    setShowModal(false); setEditing(null); setForm(emptyForm); fetchProducts();
  };

  const handleEdit = (p: ProductRow) => {
    setForm({
      title: p.title, description: p.description || "", price: Number(p.price),
      image_url: p.image_url || "", active: p.active, sort_order: p.sort_order,
    });
    setEditing(p.id); setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Produto excluído!"); fetchProducts();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Produtos / Loja</h2>
        <button onClick={() => { setForm(emptyForm); setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'hsl(245 60% 55%)', color: 'white' }}>
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>

      <div className="grid gap-3">
        {products.map((p) => (
          <motion.div key={p.id} layout className="glass-card p-4 flex items-center gap-4">
            {p.image_url ? (
              <img src={p.image_url} alt={p.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'hsl(0 0% 100% / 0.05)' }}>
                <ShoppingBag className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate">{p.title}</h3>
                {!p.active && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'hsl(0 60% 50% / 0.15)', color: 'hsl(0 60% 65%)' }}>Inativo</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{p.description}</p>
              <span className="text-sm font-bold mt-1 inline-block" style={{ color: 'hsl(245 60% 70%)' }}>R$ {Number(p.price).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => handleEdit(p)} className="p-2 rounded-lg transition-colors" style={{ background: 'hsl(0 0% 100% / 0.05)' }}>
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg transition-colors" style={{ background: 'hsl(0 60% 50% / 0.1)' }}>
                <Trash2 className="w-4 h-4" style={{ color: 'hsl(0 60% 60%)' }} />
              </button>
            </div>
          </motion.div>
        ))}
        {products.length === 0 && (
          <div className="glass-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum produto cadastrado</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card-strong w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto scrollbar-hide"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">{editing ? "Editar Produto" : "Novo Produto"}</h3>
                <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Nome *</label>
                  <input className="glass-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Pomada Modeladora" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Descrição</label>
                  <textarea className="glass-input min-h-[80px] resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição do produto" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Preço (R$) *</label>
                  <input className="glass-input" type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
                </div>

                {/* Image */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Foto</label>
                  {form.image_url && (
                    <div className="relative mb-3 rounded-xl overflow-hidden" style={{ border: '1px solid hsl(0 0% 100% / 0.08)' }}>
                      <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover" />
                      <button onClick={() => setForm({ ...form, image_url: "" })} className="absolute top-2 right-2 p-1 rounded-lg" style={{ background: 'hsl(0 0% 0% / 0.6)' }}>
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: 'hsl(0 0% 100% / 0.05)', border: '1px solid hsl(0 0% 100% / 0.08)', color: 'hsl(0 0% 70%)' }}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Enviando..." : "Upload de Imagem"}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
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

              <button onClick={handleSave}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: 'hsl(245 60% 55%)', color: 'white' }}>
                <Save className="w-4 h-4" /> {editing ? "Atualizar" : "Criar Produto"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
