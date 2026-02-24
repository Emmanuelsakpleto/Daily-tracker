-- 1. Création de la table 'profiles' (Liée à l'authentification)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT,
    year INTEGER DEFAULT extract(year from now())
);

-- Activation de Row Level Security (RLS) pour protéger tes données
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see and edit their own profile" 
    ON public.profiles FOR ALL USING (auth.uid() = id);

-- Trigger pour créer automatiquement un 'profile' quand un user s'inscrit
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created 
    AFTER INSERT ON auth.users 
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Création de la table 'habits' (Liste globale des habitudes)
CREATE TABLE public.habits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid() NOT NULL,
    title TEXT NOT NULL,
    category TEXT
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only owner can access habits" ON public.habits FOR ALL USING (auth.uid() = user_id);

-- 3. Création de la table 'books' (Bibliothèque globale)
CREATE TABLE public.books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid() NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    read_pages INTEGER DEFAULT 0,
    total_pages INTEGER DEFAULT 1
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only owner can access books" ON public.books FOR ALL USING (auth.uid() = user_id);

-- 4. Création de la table 'scholarships' (Projets/Candidatures)
CREATE TABLE public.scholarships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid() NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL
);

ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only owner can access scholarships" ON public.scholarships FOR ALL USING (auth.uid() = user_id);

-- 5. Création de la table 'braindumps' (Boîte à idées)
CREATE TABLE public.braindumps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid() NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.braindumps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only owner can access braindumps" ON public.braindumps FOR ALL USING (auth.uid() = user_id);

-- 6. Création de la table principale 'daily_records'
CREATE TABLE public.daily_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid() NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    deep_work_minutes INTEGER DEFAULT 0,
    finance_income DECIMAL DEFAULT 0,
    finance_expense DECIMAL DEFAULT 0,
    UNIQUE(user_id, date) -- Un seul "journal" global par utilisateur par jour
);

ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only owner can access daily records" ON public.daily_records FOR ALL USING (auth.uid() = user_id);

-- 7. Création de la table de jointure 'habit_completions' (Habitudes cochées par jour)
CREATE TABLE public.habit_completions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    record_id UUID REFERENCES public.daily_records(id) ON DELETE CASCADE,
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
    UNIQUE(record_id, habit_id) -- On ne peut cocher qu'une fois la même habitude le même jour
);

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only owner can access habit completions" ON public.habit_completions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.daily_records dr WHERE dr.id = habit_completions.record_id AND dr.user_id = auth.uid())
);

-- 8. Création de la table 'todos' (Tâches du jour)
CREATE TABLE public.todos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    record_id UUID REFERENCES public.daily_records(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    done BOOLEAN DEFAULT false
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only owner can access todos" ON public.todos FOR ALL USING (
    EXISTS (SELECT 1 FROM public.daily_records dr WHERE dr.id = todos.record_id AND dr.user_id = auth.uid())
);

-- 9. Création de la table 'expenses' (Dépenses catégorisées)
CREATE TABLE public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    record_id UUID REFERENCES public.daily_records(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    category TEXT NOT NULL
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only owner can access expenses" ON public.expenses FOR ALL USING (
    EXISTS (SELECT 1 FROM public.daily_records dr WHERE dr.id = expenses.record_id AND dr.user_id = auth.uid())
);
