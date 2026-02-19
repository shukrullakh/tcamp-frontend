import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus } from "lucide-react";
import { QuestionCard } from "@/components/QuestionCard";
import { MOCK_QUESTIONS } from "@/lib/mockData";

export function Home() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("newest");

  const filteredQuestions = MOCK_QUESTIONS.filter(q => 
    q.title.toLowerCase().includes(search.toLowerCase()) || 
    q.content.toLowerCase().includes(search.toLowerCase()) ||
    q.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-10 md:py-16">
        <h1 className="text-4xl md:text-5xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 animate-in fade-in slide-in-from-bottom-4 duration-700">
          Ask, Learn, Share.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
          The student community platform empowered by AI to help you master your coursework.
        </p>
        
        <div className="flex justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          <Link href="/ask">
            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all">
              Ask a Question
            </Button>
          </Link>
          <Link href="/ask-ai">
            <Button variant="outline" size="lg" className="rounded-full px-8">
              Ask AI Assistant
            </Button>
          </Link>
        </div>
      </section>

      {/* Search and Filters */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm py-4 border-b md:border-none md:bg-transparent">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search topics, questions, tags..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 bg-card shadow-sm border-border/60 rounded-xl"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px] h-11 bg-card shadow-sm border-border/60 rounded-xl">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" />
                  <SelectValue placeholder="Filter" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="unanswered">Unanswered</SelectItem>
              </SelectContent>
            </Select>
            
            <Link href="/ask" className="md:hidden ml-auto">
              <Button size="icon" className="h-11 w-11 rounded-xl">
                <Plus className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="grid gap-6 animate-in fade-in duration-500">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q) => (
            <QuestionCard key={q.id} {...q} compact />
          ))
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
            <h3 className="text-lg font-semibold">No questions found</h3>
            <p className="text-muted-foreground">Try adjusting your search query</p>
          </div>
        )}
      </div>
    </div>
  );
}
