import { useStore } from '../store/useStore';
import { Gift, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function ParrainageTab() {
  const currentUser = useStore((s) => s.currentUser);
  const [copied, setCopied] = useState(false);

  if (!currentUser) return null;

  const code = currentUser.referralCode || 'NOOR-BIENVENUE';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Rejoignez NoorDrive !',
        text: `Utilise mon code ${code} pour gagner un bonus de bienvenue sur NoorDrive !`,
        url: 'https://noordrive.com',
      }).catch(console.error);
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="pt-20 px-4 max-w-md mx-auto space-y-6 pb-20">
      <div className="text-center space-y-2 mt-4">
        <div className="w-16 h-16 bg-noordrive-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-noordrive-green" />
        </div>
        <h2 className="text-2xl font-bold">Invitez vos amis</h2>
        <p className="text-gray-500 text-sm px-4">
          Gagnez des bonus sur votre portefeuille pour chaque ami qui s'inscrit avec votre code et valide son compte.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-4">
        <p className="font-semibold text-gray-700">Votre code de parrainage</p>
        <div 
          onClick={copyToClipboard}
          className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl py-4 flex items-center justify-center gap-3 cursor-pointer hover:bg-gray-100 transition"
        >
          <span className="text-3xl font-black tracking-widest text-noordrive-black">{code}</span>
          {copied ? <CheckCircle2 className="w-6 h-6 text-noordrive-green" /> : <Copy className="w-6 h-6 text-gray-400" />}
        </div>
        
        <button 
          onClick={shareCode}
          className="w-full bg-noordrive-green text-white font-bold py-3.5 rounded-full shadow-lg hover:brightness-105 transition active:scale-95 mt-4"
        >
          Partager mon code
        </button>
      </div>

      <div className="bg-gray-100 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-gray-800">Comment ça marche ?</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start gap-2">
            <span className="font-bold text-noordrive-green">1.</span> Partagez votre code unique à vos amis.
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-noordrive-green">2.</span> Vos amis l'entrent lors de leur inscription sur l'application.
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-noordrive-green">3.</span> Vous recevez un bonus directement sur votre portefeuille ! Vos amis reçoivent aussi un cadeau de bienvenue.
          </li>
        </ul>
      </div>
    </div>
  );
}
