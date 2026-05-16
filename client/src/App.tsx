import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeContext";
import { NotificationProvider } from "@/components/NotificationContext";
import { LanguageProvider } from "@/components/LanguageContext";
import { Layout } from "@/components/Layout";
import { ScheduledPostPublisher } from "@/components/PostComposer";
import NotFound from "@/pages/not-found";

import { Home } from "@/pages/Home";
import { QuestionDetails } from "@/pages/QuestionDetails";
import { AskQuestion } from "@/pages/AskQuestion";
import { AskAI } from "@/pages/AskAI";
import { Notifications } from "@/pages/Notifications";
import { Profile } from "@/pages/Profile";
import { Settings } from "@/pages/Settings";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Privacy } from "@/pages/Privacy";
import { Terms } from "@/pages/Terms";
import { Support } from "@/pages/Support";
import { UserProfile } from "@/pages/UserProfile";
import { AdminPanel } from "@/pages/AdminPanel";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/" component={Home} />
        <Route path="/question/:id" component={QuestionDetails} />
        <Route path="/ask" component={AskQuestion} />
        <Route path="/ask-ai" component={AskAI} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/profile" component={Profile} />
        <Route path="/profile/:username" component={UserProfile} />
        <Route path="/settings" component={Settings} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/support" component={Support} />
        <Route path="/user/:id" component={UserProfile} />
        <Route path="/user/:username" component={UserProfile} />
        <Route path="/admin" component={AdminPanel} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="talaba-ui-theme">
        <LanguageProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Router />
              <ScheduledPostPublisher />
              <Toaster />
            </TooltipProvider>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
