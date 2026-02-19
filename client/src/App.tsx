import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeContext";
import { NotificationProvider } from "@/components/NotificationContext";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";

// Pages
import { Home } from "@/pages/Home";
import { QuestionDetails } from "@/pages/QuestionDetails";
import { AskQuestion } from "@/pages/AskQuestion";
import { AskAI } from "@/pages/AskAI";
import { Notifications } from "@/pages/Notifications";
import { Profile } from "@/pages/Profile";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/question/:id" component={QuestionDetails} />
        <Route path="/ask" component={AskQuestion} />
        <Route path="/ask-ai" component={AskAI} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="talaba-ui-theme">
        <NotificationProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
