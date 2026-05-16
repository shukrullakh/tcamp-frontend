import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, MessageSquare, HelpCircle, CheckCircle } from "lucide-react";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";

export function Support() {
  const { lang } = useLang();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      setError(t(lang, "common.support.required"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSent(true);
        setForm({ name: "", email: "", message: "" });
      } else {
        setError(t(lang, "common.support.submitError"));
      }
    } catch {
      setError(t(lang, "common.support.networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t(lang, "common.support.title")}</h1>
        <p className="text-muted-foreground">{t(lang, "common.support.contactDescription")}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="text-center p-4">
          <HelpCircle className="w-8 h-8 mx-auto text-primary mb-2" />
          <h3 className="font-semibold text-sm">{t(lang, "common.support.faq")}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t(lang, "common.support.faqDescription")}</p>
        </Card>
        <Card className="text-center p-4">
          <MessageSquare className="w-8 h-8 mx-auto text-primary mb-2" />
          <h3 className="font-semibold text-sm">{t(lang, "common.support.community")}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t(lang, "common.support.communityDescription")}</p>
        </Card>
        <Card className="text-center p-4">
          <Mail className="w-8 h-8 mx-auto text-primary mb-2" />
          <h3 className="font-semibold text-sm">{t(lang, "auth.email")}</h3>
          <p className="text-xs text-muted-foreground mt-1">support@tcamp.uz</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t(lang, "common.support.contactTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sent ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
              <h3 className="font-semibold">{t(lang, "common.support.sentTitle")}</h3>
              <p className="text-muted-foreground text-sm">{t(lang, "common.support.sentDescription")}</p>
              <Button variant="outline" onClick={() => setSent(false)}>{t(lang, "common.support.sendAgain")}</Button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t(lang, "common.support.name")}</Label>
                  <Input
                    placeholder={t(lang, "common.support.namePlaceholder")}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t(lang, "auth.email")}</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t(lang, "common.support.message")}</Label>
                <Textarea
                  placeholder={t(lang, "common.support.messagePlaceholder")}
                  className="min-h-[120px]"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t(lang, "common.actions.send")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
