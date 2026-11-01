import numpy as np, soundfile as sf, librosa, subprocess, os, scipy.signal as ss
SR=44100
def load(n): y,_=sf.read(n+'.wav',dtype='float32'); return y if y.ndim==2 else np.stack([y,y],1)
def beats(i):
    y,sr=librosa.load(f's{i}.wav',sr=22050); t,b=librosa.beat.beat_track(y=y,sr=sr); bt=librosa.frames_to_time(b,sr=sr)
    o=librosa.onset.onset_strength(y=y,sr=sr); acc=[o[b[k::4]].mean() for k in range(4)]; ph=int(np.argmax(acc)); return bt[ph:], float(np.atleast_1d(t)[0])
B={i:beats(i) for i in (1,2,3)}
def seg(x,i,b0,nb):
    bt,_=B[i]; s=int(bt[b0]*SR); e=int(bt[min(b0+nb,len(bt)-1)]*SR); return x[s:e].copy()
def rb(x,tempo=1.0,semi=0.0):
    if abs(tempo-1)<1e-3 and abs(semi)<1e-3: return x
    sf.write('_in.wav',x,SR); subprocess.run(['ffmpeg','-v','error','-y','-i','_in.wav','-af',f'rubberband=tempo={tempo}:pitch={2**(semi/12)}:transients=crisp','_out.wav'],check=True); y,_=sf.read('_out.wav',dtype='float32'); return y
def fade(x,fi=0,fo=0):
    x=x.copy(); n=len(x)
    if fi: k=int(fi*SR); x[:k]*=np.linspace(0,1,k)[:,None]
    if fo: k=int(fo*SR); x[-k:]*=np.linspace(1,0,k)[:,None]
    return x
def cat(a,b,xf=1.0):
    k=int(xf*SR); k=min(k,len(a),len(b)); out=np.concatenate([a[:-k], a[-k:]*np.linspace(1,0,k)[:,None]+b[:k]*np.linspace(0,1,k)[:,None], b[k:]]); return out
def mixon(a,b,g=1.0,at=0.0):
    s=int(at*SR); n=max(len(a),s+len(b)); o=np.zeros((n,2),np.float32); o[:len(a)]+=a; o[s:s+len(b)]+=b*g; return o
def loopto(x,dur):
    n=int(dur*SR); r=np.concatenate([x]*(n//len(x)+1)); return r[:n]
def lp(x,f): b,a=ss.butter(2,f/(SR/2)); return ss.lfilter(b,a,x,axis=0).astype(np.float32)
def hp(x,f): b,a=ss.butter(2,f/(SR/2),'high'); return ss.lfilter(b,a,x,axis=0).astype(np.float32)
def verb(x,t=2.4,wet=0.3):
    n=int(t*SR); rng=np.random.default_rng(1); ir=np.stack([rng.standard_normal(n)*np.exp(-np.linspace(0,7,n)) for _ in range(2)],1).astype(np.float32); ir/=np.abs(ir).sum(0)*0.02
    pad=np.concatenate([x,np.zeros((n,2),np.float32)]); w=np.stack([ss.fftconvolve(pad[:,c],ir[:,c])[:len(pad)] for c in range(2)],1)
    w=lp(w,5000); return (pad*(1-wet*0.5)+w*wet*0.5/ (np.abs(w).max()+1e-9)*np.abs(x).max()).astype(np.float32)
def tail(x,t=3.0): return np.concatenate([x,np.zeros((int(t*SR),2),np.float32)])
def save(x,name):
    x=x/ (np.abs(x).max()+1e-9)*0.95; sf.write('_m.wav',x,SR)
    subprocess.run(['ffmpeg','-v','error','-y','-i','_m.wav','-af','loudnorm=I=-15:TP=-1.2','-ar','44100','-b:a','112k',name+'.mp3'],check=True); print(name, round(len(x)/SR,1),'s')
s1,s2,s3=load('s1'),load('s2'),load('s3'); h1,h2,h3=load('h1'),load('h2'),load('h3'); p1,p2,p3=load('p1'),load('p2'),load('p3')
T1,T2,T3=B[1][1],B[2][1],B[3][1]
def loud(i,x,nb=32):
    bt,_=B[i]; best=0;bi=0
    for k in range(0,len(bt)-nb-1,4):
        v=np.sqrt(np.mean(seg(x,i,k,nb)**2));
        if v>best: best,bi=v,k
    return bi
L1,L2,L3=loud(1,s1),loud(2,s2),loud(3,s3)
print('bpm',T1,T2,T3,'loud',L1,L2,L3)
# 1 オープニングA: 行軍の太鼓8小節 → n147の主旋律（行軍のテンポに合わせる）＋太鼓を重ねる
dr=seg(p1,1,L1,32); mel=rb(seg(s3,3,L3,64),T1/T3); drl=loopto(seg(p1,1,L1,32),len(mel)/SR)
x=cat(fade(dr,1.0)*1.3, mixon(mel,drl,0.55),1.0); save(fade(verb(x,2.5,0.25),0,4),'r01_opening_march2theme')
# 2 オープニングB: 荘厳スロー（n147の和音と旋律を遅く低く＋大きな残響、行軍の太鼓を遠く）
tB=T3*0.8; mel=rb(seg(h3,3,L3,48),0.8,-2); dr2=loopto(rb(seg(p1,1,L1,16),tB/T1),len(mel)/SR)
save(fade(verb(mixon(mel,lp(dr2,3000),0.5),3.5,0.45),2.5,5),'r02_opening_grand_slow')
# 3 鼓笛マーチ強め: 行軍の太鼓を前に、低音を足す
x=seg(s1,1,L1,64); x=x+seg(p1,1,L1,64)*0.8+lp(seg(s1,1,L1,64),180)*0.6; save(fade(x,0.5,4),'r03_march_heavy_drums')
# 4 メニュー/ブリーフィング: 作戦会議を少し遅く暗く＋遠い太鼓
mel=lp(rb(seg(s2,2,L2,48),0.9),4500); dr=loopto(rb(seg(p1,1,L1,16),T2*0.9/T1),len(mel)/SR)
save(fade(verb(mixon(mel,lp(dr,2500),0.35),2.5,0.3),1.5,4),'r04_briefing_dark')
# 5 待機（静か）: 作戦会議の和音だけを遅く低く
save(fade(verb(rb(seg(h2,2,L2,32),0.85,-1),4.0,0.5),3,5),'r05_standby_ambient')
# 6 メドレー: 行軍 → 作戦会議 → n147（テンポ140にそろえ、つなぎに太鼓）
TT=140; a=rb(seg(s1,1,L1,32),TT/T1); b=rb(seg(s2,2,L2,32),TT/T2,1); c=rb(seg(s3,3,L3,48),TT/T3,-2); fill=rb(seg(p1,1,L1,8),TT/T1)
x=cat(cat(cat(cat(a,fill,0.4),b,0.6),fill,0.4),c,0.8); save(fade(verb(x,2.5,0.2),0.5,5),'r06_medley_3songs')
# 7 クリア: n147の一番盛り上がる8小節＋余韻
x=tail(seg(s3,3,L3,32),0.1); save(fade(verb(x,4.0,0.5),0.3,6),'r07_clear_fanfare')
# 8 戦闘の高揚: n147を少し速く＋2曲の太鼓を重ねる
mel=rb(seg(s3,3,L3,64),1.06); d1=loopto(rb(seg(p1,1,L1,16),T3*1.06/T1),len(mel)/SR); d3=seg(p3,3,L3,64); d3=rb(d3,1.06)[:len(mel)]
x=mixon(mixon(mel,d1,0.5),d3,0.5); save(fade(x,0.3,4),'r08_battle_drive')
# 9 敗北: 作戦会議の和音を遅く低く暗く
save(fade(verb(lp(rb(seg(h2,2,L2,24),0.75,-3),3000),5.0,0.6),2,6),'r09_defeat_slow')
# 10 オープニングC: n147を行軍のキー（ハ長調）とテンポに寄せ、行軍の太鼓とスネアを通しで
mel=rb(seg(s3,3,L3,64),T1/T3,3); dr=loopto(seg(p1,1,L1,32),len(mel)/SR); intro=fade(seg(p1,1,L1,16),2)*1.2
save(fade(cat(intro,mixon(mel,dr,0.6),0.8),0,4),'r10_opening_theme_in_march_key')
# 11 タイトルの短いループ（30秒）: 行軍の太鼓＋n147の和音
mel=rb(seg(h3,3,L3,16),T1/T3,3); dr=seg(p1,1,L1,len(B[1][0])) ; dr=loopto(seg(p1,1,L1,16),len(mel)/SR)
x=mixon(mel*0.9,dr,0.8); x=np.concatenate([x,x]); save(fade(x,0.05,0.05),'r11_title_loop')
# 12 作戦会議マーチ: 作戦会議に行軍の太鼓を強く
mel=seg(s2,2,L2,48); dr=loopto(rb(seg(p1,1,L1,16),T2/T1),len(mel)/SR); save(fade(mixon(mel,dr,0.85),0.5,4),'r12_briefing_march')
