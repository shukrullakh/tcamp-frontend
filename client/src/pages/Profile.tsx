import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_QUESTIONS } from "@/lib/mockData";
import { QuestionCard } from "@/components/QuestionCard";
import { MapPin, Link as LinkIcon, Calendar, Mail, Edit2, Check, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function Profile() {
  const { toast } = useToast();
  const userQuestions = MOCK_QUESTIONS; 
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "Student User",
    username: "felix_dev",
    bio: "Computer Science Student • AI Enthusiast"
  });
  const [tempData, setTempData] = useState({ ...profileData });

  const handleSave = () => {
    setProfileData({ ...tempData });
    setIsEditing(false);
    toast({
      title: "Profil yangilandi",
      description: "Ma'lumotlaringiz muvaffaqiyatli saqlandi.",
    });
  };

  const handleCancel = () => {
    setTempData({ ...profileData });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <Card className="mb-8 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900" />
        <CardContent className="relative pt-0">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-12 mb-6 px-4">
            <Avatar className="w-24 h-24 border-4 border-card shadow-md">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
              <AvatarFallback>SU</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1 mt-2 md:mt-0 pb-1">
              {isEditing ? (
                <div className="space-y-3 pt-2">
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Ism</label>
                    <Input 
                      value={tempData.name} 
                      onChange={(e) => setTempData({...tempData, name: e.target.value})}
                      className="h-9"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Login (Username)</label>
                    <Input 
                      value={tempData.username} 
                      onChange={(e) => setTempData({...tempData, username: e.target.value})}
                      className="h-9"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Biografiya</label>
                    <Input 
                      value={tempData.bio} 
                      onChange={(e) => setTempData({...tempData, bio: e.target.value})}
                      className="h-9"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold font-heading">{profileData.name}</h1>
                  <p className="text-sm font-medium text-primary">@{profileData.username}</p>
                  <p className="text-muted-foreground">{profileData.bio}</p>
                </>
              )}
            </div>

            <div className="flex gap-2 pb-1 w-full md:w-auto">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4 mr-2" /> Saqlash
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" /> Bekor qilish
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" /> Tahrirlash
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 px-4 text-sm text-muted-foreground border-t pt-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Tashkent, Uzbekistan
            </div>
            <div className="flex items-center gap-1">
              <LinkIcon className="w-4 h-4" />
              github.com/student
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Joined January 2024
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
          <TabsTrigger 
            value="questions"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
          >
            Questions ({userQuestions.length})
          </TabsTrigger>
          <TabsTrigger 
            value="answers"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
          >
            Answers (12)
          </TabsTrigger>
          <TabsTrigger 
            value="likes"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
          >
            Likes (45)
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions" className="mt-6 space-y-6">
          {userQuestions.map(q => (
            <QuestionCard key={q.id} {...q} compact />
          ))}
        </TabsContent>
        
        <TabsContent value="answers" className="mt-6">
          <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            No answers visible in this mock profile.
          </div>
        </TabsContent>
        
         <TabsContent value="likes" className="mt-6">
          <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            No liked posts visible in this mock profile.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
