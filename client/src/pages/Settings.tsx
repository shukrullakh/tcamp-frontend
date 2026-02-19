import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Globe, Lock, Bell, Eye, Shield, Languages } from "lucide-react";

export function Settings() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = (section: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Sozlamalar saqlandi",
        description: `${section} muvaffaqiyatli yangilandi.`,
      });
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-heading font-bold">Sozlamalar</h1>
        <p className="text-muted-foreground">Hisobingiz va platforma interfeysini o'zingizga moslang.</p>
      </div>

      <div className="grid gap-6">
        {/* Language Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Til va Hudud</CardTitle>
            </div>
            <CardDescription>Platforma interfeysi tilini tanlang.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="language">Asosiy til</Label>
              <Select defaultValue="uz">
                <SelectTrigger id="language" className="w-full md:w-[300px]">
                  <SelectValue placeholder="Tilni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uz">O'zbekcha</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ru">Русский</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 px-6 py-3 justify-end">
            <Button size="sm" onClick={() => handleSave("Til sozlamalari")}>Saqlash</Button>
          </CardFooter>
        </Card>

        {/* Password Reset */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Xavfsizlik</CardTitle>
            </div>
            <CardDescription>Parolingizni yangilang va hisob xavfsizligini ta'minlang.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current-password">Joriy parol</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Yangi parol</Label>
                <Input id="new-password" type="password" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 px-6 py-3 justify-end">
            <Button size="sm" onClick={() => handleSave("Xavfsizlik sozlamalari")}>Parolni yangilash</Button>
          </CardFooter>
        </Card>

        {/* Extra Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Bildirishnomalar va Maxfiylik</CardTitle>
            </div>
            <CardDescription>Qaysi turdagi xabarlarni olishni xohlashingizni belgilang.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email bildirishnomalari</Label>
                <p className="text-sm text-muted-foreground text-balance">
                  Yangi javoblar va layklar haqida email orqali xabar olish.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between border-t pt-6">
              <div className="space-y-0.5">
                <Label className="text-base">Profil ochiqligi</Label>
                <p className="text-sm text-muted-foreground text-balance">
                  Sizning profilingizni boshqa foydalanuvchilar ko'ra olishi.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
