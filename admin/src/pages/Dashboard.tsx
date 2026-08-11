
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Car, DollarSign } from 'lucide-react';

const mockData = [
  { name: 'Lun', revenus: 4000 },
  { name: 'Mar', revenus: 3000 },
  { name: 'Mer', revenus: 2000 },
  { name: 'Jeu', revenus: 2780 },
  { name: 'Ven', revenus: 1890 },
  { name: 'Sam', revenus: 2390 },
  { name: 'Dim', revenus: 3490 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Vue d'ensemble</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Revenus (Jour)" value="24 500 FCFA" icon={DollarSign} trend="+12%" />
        <MetricCard title="Courses Actives" value="18" icon={Car} trend="+5%" />
        <MetricCard title="Nouveaux Chauffeurs" value="5" icon={Users} trend="+2%" />
        <MetricCard title="Croissance" value="+18.5%" icon={TrendingUp} trend="+4%" />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold mb-6">Évolution des revenus (7 derniers jours)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="revenus" stroke="#00d061" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h4 className="text-3xl font-bold">{value}</h4>
        </div>
        <div className="bg-gray-50 p-3 rounded-xl">
          <Icon className="w-6 h-6 text-noordrive-black" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm font-medium text-noordrive-green">
        <span>{trend}</span>
        <span className="text-gray-400 ml-2">vs hier</span>
      </div>
    </div>
  );
}
