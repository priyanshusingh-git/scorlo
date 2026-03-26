"use client";

export function LoginBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#f6f2ea]">
      <div className="absolute inset-0 opacity-100">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] rounded-full opacity-60 animate-pulse-slow"
          style={{ 
            background: 'radial-gradient(circle, rgba(15, 139, 141, 0.15) 0%, transparent 70%)',
            filter: 'blur(100px)'
          }} 
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[90%] h-[90%] rounded-full opacity-40 animate-pulse-reverse"
          style={{ 
            background: 'radial-gradient(circle, rgba(192, 132, 26, 0.12) 0%, transparent 70%)',
            filter: 'blur(120px)'
          }} 
        />
      </div>
      <div 
        className="absolute inset-0 opacity-[0.4] brightness-100 contrast-100 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Ffilter id='n' %3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
