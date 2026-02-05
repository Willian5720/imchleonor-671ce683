 import { useState } from 'react';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { ArrowUpRight, Wallet, AlertTriangle, Info } from 'lucide-react';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 
 interface WithdrawToWalletProps {
   isOpen: boolean;
   onClose: () => void;
   onWithdraw: (coins: number, walletAddress: string) => Promise<boolean>;
   currentCoins: number;
   isProcessing: boolean;
 }
 
 export const WithdrawToWallet = ({
   isOpen,
   onClose,
   onWithdraw,
   currentCoins,
   isProcessing,
 }: WithdrawToWalletProps) => {
   const [inputCoins, setInputCoins] = useState('');
   const [walletAddress, setWalletAddress] = useState('');
   const [inputMode, setInputMode] = useState<'coins' | 'usdt'>('usdt');
 
   const SERVICE_FEE_PERCENT = 0.30; // 30%
   const MIN_WITHDRAWAL_USDT = 10;
 
   const coinsValue = parseFloat(inputCoins) || 0;
   const grossUsdtValue = coinsValue * 100;
   const serviceFee = grossUsdtValue * SERVICE_FEE_PERCENT;
   const netUsdtValue = grossUsdtValue - serviceFee;
   
   const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
   const isValidAmount = coinsValue > 0 && coinsValue <= currentCoins && netUsdtValue >= MIN_WITHDRAWAL_USDT;
   const isValid = isValidAddress && isValidAmount;
 
   const handleCoinsChange = (value: string) => {
     const numValue = value.replace(/[^0-9.]/g, '');
     setInputCoins(numValue);
   };
 
   const handleUsdtChange = (value: string) => {
     const numValue = value.replace(/[^0-9.]/g, '');
     const usdtValue = parseFloat(numValue) || 0;
     setInputCoins((usdtValue / 100).toFixed(4));
   };
 
   const handleWithdraw = async () => {
     if (!isValid) return;
     
     const success = await onWithdraw(coinsValue, walletAddress);
     if (success) {
       setInputCoins('');
       setWalletAddress('');
       onClose();
     }
   };
 
   return (
     <Dialog open={isOpen} onOpenChange={onClose}>
       <DialogContent className="glass-card border-border max-w-md">
         <DialogHeader>
           <DialogTitle className="font-display text-xl text-primary neon-text-green flex items-center gap-2">
             <ArrowUpRight className="w-5 h-5" />
             Sacar para Bybit
           </DialogTitle>
           <DialogDescription className="text-muted-foreground">
             Envie USDT da plataforma para sua carteira Bybit via ERC20
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-4 pt-4">
           {/* Current balance info */}
           <div className="bg-card/50 rounded-lg p-4 border border-border">
             <div className="flex items-center justify-between">
               <span className="text-muted-foreground text-sm">Saldo disponível:</span>
               <div className="text-right">
                 <span className="text-primary font-display font-bold">
                   {currentCoins.toFixed(4)} IMCH
                 </span>
                 <span className="text-muted-foreground text-xs block">
                   ≈ {(currentCoins * 100).toFixed(2)} USDT bruto
                 </span>
               </div>
             </div>
           </div>
 
           {/* Mode toggle */}
           <div className="flex gap-2">
             <Button
               variant={inputMode === 'usdt' ? 'default' : 'outline'}
               onClick={() => setInputMode('usdt')}
               className="flex-1 font-display"
               size="sm"
             >
               Valor em USDT
             </Button>
             <Button
               variant={inputMode === 'coins' ? 'default' : 'outline'}
               onClick={() => setInputMode('coins')}
               className="flex-1 font-display"
               size="sm"
             >
               Valor em IMCH
             </Button>
           </div>
 
           {/* Amount input */}
           <div className="space-y-2">
             <Label className="text-muted-foreground">
               {inputMode === 'usdt' ? 'Valor bruto em USDT' : 'Quantidade de IMCH'}
             </Label>
             <div className="relative">
               <Input
                 type="text"
                 inputMode="decimal"
                 placeholder="0.00"
                 value={inputMode === 'usdt' ? (grossUsdtValue > 0 ? grossUsdtValue.toFixed(2) : '') : inputCoins}
                 onChange={(e) => inputMode === 'usdt' ? handleUsdtChange(e.target.value) : handleCoinsChange(e.target.value)}
                 className="bg-card border-border text-foreground text-lg pr-16 font-mono"
               />
               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                 {inputMode === 'usdt' ? 'USDT' : 'IMCH'}
               </span>
             </div>
           </div>
 
           {/* Wallet address input */}
           <div className="space-y-2">
             <Label htmlFor="wallet" className="text-muted-foreground flex items-center gap-2">
               <Wallet className="w-4 h-4" />
               Endereço ERC20 (Ethereum)
             </Label>
             <Input
               id="wallet"
               type="text"
               placeholder="0x..."
               value={walletAddress}
               onChange={(e) => setWalletAddress(e.target.value.trim())}
               className="bg-card border-border text-foreground font-mono text-sm"
             />
             {walletAddress && !isValidAddress && (
               <p className="text-destructive text-xs">
                 Endereço inválido. Use um endereço ERC20 válido (0x...)
               </p>
             )}
           </div>
 
           {/* Fee breakdown */}
           {coinsValue > 0 && (
             <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Valor bruto:</span>
                 <span className="text-foreground">{grossUsdtValue.toFixed(2)} USDT</span>
               </div>
               <div className="flex justify-between text-yellow-500">
                 <span>Taxa de serviço (30%):</span>
                 <span>-{serviceFee.toFixed(2)} USDT</span>
               </div>
               <div className="flex justify-between font-bold border-t border-border pt-1 mt-1">
                 <span className="text-foreground">Você recebe:</span>
                 <span className="text-primary">{netUsdtValue.toFixed(2)} USDT</span>
               </div>
             </div>
           )}
 
           {/* Minimum warning */}
           {coinsValue > 0 && netUsdtValue < MIN_WITHDRAWAL_USDT && (
             <Alert variant="destructive">
               <AlertTriangle className="h-4 w-4" />
               <AlertDescription>
                 Valor líquido mínimo é {MIN_WITHDRAWAL_USDT} USDT. Aumente o valor.
               </AlertDescription>
             </Alert>
           )}
 
           {coinsValue > currentCoins && (
             <Alert variant="destructive">
               <AlertTriangle className="h-4 w-4" />
               <AlertDescription>
                 Valor excede o saldo disponível
               </AlertDescription>
             </Alert>
           )}
 
           {/* Network info */}
           <Alert>
             <Info className="h-4 w-4" />
             <AlertDescription className="text-xs">
               O saque será enviado via rede Ethereum (ERC20). Pode levar 10-30 minutos para confirmar na blockchain.
             </AlertDescription>
           </Alert>
 
           {/* Quick amount buttons */}
           <div className="space-y-2">
             <Label className="text-muted-foreground text-xs">Valores rápidos:</Label>
             <div className="flex flex-wrap gap-2">
               {[25, 50, 75, 100].map((percent) => {
                 const coinsAmount = (currentCoins * percent) / 100;
                 return (
                   <Button
                     key={percent}
                     variant="outline"
                     size="sm"
                     onClick={() => setInputCoins(coinsAmount.toFixed(4))}
                     className="text-xs"
                     disabled={currentCoins <= 0}
                   >
                     {percent}%
                   </Button>
                 );
               })}
             </div>
           </div>
 
           {/* Action buttons */}
           <div className="flex gap-3 pt-2">
             <Button
               variant="outline"
               onClick={onClose}
               className="flex-1"
               disabled={isProcessing}
             >
               Cancelar
             </Button>
             <Button
               onClick={handleWithdraw}
               disabled={!isValid || isProcessing}
               className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-display"
             >
               {isProcessing ? (
                 <>Processando...</>
               ) : (
                 <>
                   <ArrowUpRight className="w-4 h-4 mr-2" />
                   Sacar
                 </>
               )}
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 };