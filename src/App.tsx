import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  PieChart as PieChartIcon, 
  List, 
  Trash2, 
  ChevronRight,
  Car,
  Fuel,
  Wrench,
  Utensils,
  LayoutDashboard,
  History,
  Settings as SettingsIcon,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Transaction, TransactionType, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from './types';

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-white rounded-2xl p-6 shadow-sm border border-slate-100", className)}>
    {children}
  </div>
);

const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string; value: string; icon: any; color: string; trend?: string }) => (
  <Card className="flex items-center gap-4">
    <div className={cn("p-3 rounded-xl", color)}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      {trend && <p className="text-xs mt-1 text-emerald-600 font-medium">{trend}</p>}
    </div>
  </Card>
);

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [type, setType] = useState<TransactionType>('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem('driver_transactions');
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('driver_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      amount: parseFloat(amount),
      category,
      date,
      description,
    };

    setTransactions([newTransaction, ...transactions]);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setType('income');
    setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // Calculations
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthly = transactions.filter(t => {
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start: monthStart, end: monthEnd });
    });

    const income = monthly.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthly.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const profit = income - expense;

    return { income, expense, profit };
  }, [transactions]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayTransactions = transactions.filter(t => t.date === dateStr);
      const income = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      
      return {
        name: format(d, 'EEE', { locale: ptBR }),
        ganhos: income,
        gastos: expense,
      };
    });
    return last7Days;
  }, [transactions]);

  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const cats: Record<string, number> = {};
    expenses.forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Car className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">DriverFinance</h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            Novo Registro
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {activeTab === 'dashboard' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard 
                title="Ganhos do Mês" 
                value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.income)}
                icon={TrendingUp}
                color="bg-emerald-500"
              />
              <StatCard 
                title="Gastos do Mês" 
                value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.expense)}
                icon={TrendingDown}
                color="bg-rose-500"
              />
              <StatCard 
                title="Lucro Líquido" 
                value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.profit)}
                icon={DollarSign}
                color="bg-blue-500"
              />
            </div>

            {/* Main Chart */}
            <Card>
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-blue-600" />
                Desempenho (Últimos 7 dias)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="ganhos" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <Card>
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-blue-600" />
                  Gastos por Categoria
                </h3>
                <div className="h-64 w-full">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <History className="w-12 h-12 mb-2 opacity-20" />
                      <p>Sem dados de gastos</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Recent Activity */}
              <Card>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <List className="w-5 h-5 text-blue-600" />
                  Atividade Recente
                </h3>
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          t.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                        )}>
                          {t.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{t.category}</p>
                          <p className="text-xs text-slate-500">{format(parseISO(t.date), 'dd MMM', { locale: ptBR })}</p>
                        </div>
                      </div>
                      <p className={cn(
                        "font-bold",
                        t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                      </p>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <p className="text-center text-slate-400 py-8">Nenhuma transação registrada.</p>
                  )}
                  {transactions.length > 5 && (
                    <button 
                      onClick={() => setActiveTab('history')}
                      className="w-full text-center text-sm text-blue-600 font-medium hover:underline"
                    >
                      Ver todo o histórico
                    </button>
                  )}
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Histórico Completo</h2>
              <div className="text-sm text-slate-500">{transactions.length} registros</div>
            </div>
            
            <div className="space-y-3">
              {transactions.map((t) => (
                <Card key={t.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      t.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                    )}>
                      {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{t.category}</span>
                        {t.description && <span className="text-xs text-slate-400">• {t.description}</span>}
                      </div>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(t.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={cn(
                      "text-lg font-bold",
                      t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                    </p>
                    <button 
                      onClick={() => deleteTransaction(t.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </Card>
              ))}
              {transactions.length === 0 && (
                <div className="text-center py-20">
                  <History className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400">Nenhum registro encontrado.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-slate-900">Configurações</h2>
            <Card className="space-y-6">
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Dados do Aplicativo</h4>
                <p className="text-sm text-slate-500 mb-4">Seus dados são salvos localmente no seu navegador.</p>
                <button 
                  onClick={() => {
                    if (confirm('Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.')) {
                      setTransactions([]);
                      localStorage.removeItem('driver_transactions');
                    }
                  }}
                  className="text-rose-600 text-sm font-bold border border-rose-100 bg-rose-50 px-4 py-2 rounded-xl hover:bg-rose-100 transition-colors"
                >
                  Limpar Todos os Dados
                </button>
              </div>
              <hr className="border-slate-100" />
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Sobre</h4>
                <p className="text-sm text-slate-500">
                  DriverFinance v1.0.0<br />
                  Desenvolvido para ajudar motoristas autônomos a terem controle real sobre seus lucros.
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 z-40">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-colors",
              activeTab === 'dashboard' ? "text-blue-600" : "text-slate-400"
            )}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Início</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-colors",
              activeTab === 'history' ? "text-blue-600" : "text-slate-400"
            )}
          >
            <History className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Histórico</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-colors",
              activeTab === 'settings' ? "text-blue-600" : "text-slate-400"
            )}
          >
            <SettingsIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Ajustes</span>
          </button>
        </div>
      </nav>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Novo Registro</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleAddTransaction} className="space-y-6">
                  {/* Type Selector */}
                  <div className="flex p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => { setType('income'); setCategory(''); }}
                      className={cn(
                        "flex-1 py-3 rounded-xl font-bold transition-all",
                        type === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
                      )}
                    >
                      Ganho
                    </button>
                    <button
                      type="button"
                      onClick={() => { setType('expense'); setCategory(''); }}
                      className={cn(
                        "flex-1 py-3 rounded-xl font-bold transition-all",
                        type === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500"
                      )}
                    >
                      Gasto
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Valor</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          required
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0,00"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-xl font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
                      <select 
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none"
                      >
                        <option value="">Selecione uma categoria</option>
                        {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Data</label>
                        <input 
                          type="date" 
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Descrição (Opcional)</label>
                        <input 
                          type="text" 
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Ex: Uber Black"
                          className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95",
                      type === 'income' ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200" : "bg-rose-500 hover:bg-rose-600 shadow-rose-200"
                    )}
                  >
                    Salvar Registro
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
