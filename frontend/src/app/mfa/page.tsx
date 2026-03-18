"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, MessageSquare, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import Toast from "@/components/ui/Toast";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dynamic from "next/dynamic";

const FaceAuth = dynamic(() => import("@/components/FaceAuth"), { ssr: false });


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function MFAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const userId = searchParams.get("userId");
  const storedDescriptorStr = searchParams.get("faceDescriptor");
  
  const [step, setStep] = useState<"face" | "code">("face");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [isFetchingDescriptor, setIsFetchingDescriptor] = useState(true);
  const [error, setError] = useState("");
  const [storedFaceDescriptor, setStoredFaceDescriptor] = useState<number[] | null>(null);
  const [matchConfidence, setMatchConfidence] = useState<"high" | "medium" | "low" | null>(null);

  // Fetch face descriptor if not provided in URL
  useEffect(() => {
    const fetchFaceDescriptor = async () => {
      if (userId) {
        try {
          // If we already have it in URL, use it (and decode if needed)
          if (storedDescriptorStr) {
             try {
                const parsed = JSON.parse(storedDescriptorStr);
                setStoredFaceDescriptor(Array.isArray(parsed) ? parsed : null);
                if (!parsed) setStep("code"); // Fallback if null/empty
                setIsFetchingDescriptor(false);
                return;
             } catch (e) {
                console.error("URL Descriptor parse failed:", e);
             }
          }

          const res = await fetch(`http://localhost:5000/api/auth/user/${userId}/face-descriptor`);
          if (res.ok) {
            const data = await res.json();
            // Ensure descriptor is parsed from JSON if it's a string
            const descriptor = typeof data.faceDescriptor === "string" 
              ? JSON.parse(data.faceDescriptor) 
              : data.faceDescriptor;
            
            if (descriptor && Array.isArray(descriptor)) {
                setStoredFaceDescriptor(descriptor);
            } else {
                console.warn("User has no biometric template, falling back to manual MFA.");
                setStep("code");
            }
          } else {
            console.error("Face descriptor fetch failed, status:", res.status);
            setStep("code");
          }
        } catch (err) {
          console.error("Failed to fetch face descriptor:", err);
          setStep("code"); // Fallback on error
        } finally {
          setIsFetchingDescriptor(false);
        }
      }
    };
    fetchFaceDescriptor();
  }, [storedDescriptorStr, userId]);

  const calculateEuclideanDistance = (d1: number[], d2: number[]) => {
    // Ensure we have arrays
    const arr1: number[] = Array.isArray(d1) ? d1 : Array.from(d1 as any);
    const arr2: number[] = Array.isArray(d2) ? d2 : (typeof d2 === 'string' ? JSON.parse(d2) : Array.from(d2 as any));

    if (!arr1 || !arr2 || arr1.length !== arr2.length) {
      console.error("❌ Invalid descriptor arrays:", { 
        l1: arr1?.length, 
        l2: arr2?.length,
        t1: typeof arr1,
        t2: typeof arr2
      });
      return Infinity;
    }
    
    // Check for NaN values
    const hasNaN1 = arr1.some((val: number) => isNaN(val) || !isFinite(val));
    const hasNaN2 = arr2.some((val: number) => isNaN(val) || !isFinite(val));
    
    if (hasNaN1 || hasNaN2) {
      console.error("❌ NaN values detected in descriptors:", { 
        hasNaN1, 
        hasNaN2 
      });
      return Infinity;
    }
    
    return Math.sqrt(
      arr1.reduce((sum: number, val: number, i: number) => sum + Math.pow(val - arr2[i], 2), 0)
    );
  };

  const calculateCosineSimilarity = (d1: number[], d2: number[]) => {
    // Ensure we have arrays
    const arr1: number[] = Array.isArray(d1) ? d1 : Array.from(d1 as any);
    const arr2: number[] = Array.isArray(d2) ? d2 : (typeof d2 === 'string' ? JSON.parse(d2) : Array.from(d2 as any));

    if (!arr1 || !arr2 || arr1.length !== arr2.length) {
      return 0;
    }
    
    // Check for NaN values
    const hasNaN1 = arr1.some((val: number) => isNaN(val) || !isFinite(val));
    const hasNaN2 = arr2.some((val: number) => isNaN(val) || !isFinite(val));
    
    if (hasNaN1 || hasNaN2) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < arr1.length; i++) {
      dotProduct += arr1[i] * arr2[i];
      norm1 += arr1[i] * arr1[i];
      norm2 += arr2[i] * arr2[i];
    }
    
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (norm1 * norm2);
  };

  const handleFaceCapture = (descriptor: number[]) => {
    try {
      if (!storedFaceDescriptor) {
        throw new Error("Biometric template missing. Please contact support.");
      }

      console.log("🔍 Input validation:");
      console.log("📥 Live descriptor length:", descriptor?.length);
      console.log("💾 Stored descriptor length:", storedFaceDescriptor?.length);
      console.log("📥 Live sample:", descriptor?.slice(0, 3));
      console.log("💾 Stored sample:", storedFaceDescriptor?.slice(0, 3));

      const euclideanDistance = calculateEuclideanDistance(descriptor, storedFaceDescriptor);
      const cosineSimilarity = calculateCosineSimilarity(descriptor, storedFaceDescriptor);

      // Handle validation failures
      if (euclideanDistance === Infinity || cosineSimilarity === 0) {
        setError("Invalid face descriptor data. Please try again with better lighting and positioning.");
        setMatchConfidence("low");
        return;
      }

      console.log("🔍 Face Match Analysis:");
      console.log("📊 Euclidean Distance:", euclideanDistance.toFixed(3));
      console.log("📈 Cosine Similarity:", cosineSimilarity.toFixed(3));
      console.log("✅ Distance Threshold: 0.8");
      console.log("🎯 Similarity Threshold: 0.7");

      // Use both metrics for better accuracy
      const distanceMatch = euclideanDistance < 0.8;
      const similarityMatch = cosineSimilarity > 0.7;

      console.log("🎯 Distance Match:", distanceMatch ? "PASS" : "FAIL");
      console.log("🎯 Similarity Match:", similarityMatch ? "PASS" : "FAIL");

      // More flexible matching - accept if either metric passes
      const overallMatch = distanceMatch || similarityMatch;
      const highConfidence = distanceMatch && similarityMatch;

      // Set confidence for UI feedback
      if (overallMatch) {
        setMatchConfidence(highConfidence ? "high" : "medium");
      } else {
        setMatchConfidence("low");
      }

      console.log("🏆 Overall Match:", overallMatch ? "SUCCESS" : "FAILED");
      console.log("🔥 Confidence:", highConfidence ? "HIGH" : "MEDIUM");

      if (overallMatch) {
        setTimeout(() => setStep("code"), 1500);
      } else {
        setError(`Biometric verification failed. Distance: ${euclideanDistance.toFixed(3)}, Similarity: ${cosineSimilarity.toFixed(3)}. Ensure good lighting and face position.`);
      }
    } catch (err: any) {
      console.error("❌ Face capture error:", err);
      setError(err.message || "Failed to process biometric data.");
      setMatchConfidence("low");
    }
  };

  const handleChange = (index: number, value: string) => {
    const val = value.toUpperCase().slice(0, 1);
    const newCode = [...code];
    newCode[index] = val;
    setCode(newCode);

    if (val && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const finalCode = code.join("");
    if (finalCode.length < 6) return;

    setLoading(true);
    setError("");

    try {
      const device = navigator.userAgent.includes("Mobi") ? "Mobile Device" : "Desktop Browser";

      const res = await fetch("http://localhost:5000/api/auth/verify-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: finalCode, device }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      localStorage.setItem("token", data.token);
      if (data.role === 'ROLE_ADMIN') {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code.every(char => char !== "")) {
      handleSubmit();
    }
  }, [code]);

  if (isFetchingDescriptor) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-500">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm font-black uppercase tracking-widest">Securing Session...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-500">
      {error && <Toast message={error} onClose={() => setError("")} />}
      <div className="max-w-md w-full text-center">
        {step === "face" ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <FaceAuth mode="login" onCapture={handleFaceCapture} />

            <div className="max-w-[300px] mx-auto">
              <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Biometric Access</h1>
              <p className="text-muted-foreground text-sm leading-relaxed px-4 font-medium">
                Position your face within the frame to securely unlock your Marjane Wallet.
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-white mb-6 border border-foreground/5 shadow-xl p-4">
                <img src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Identity Confirmed</h1>
              <p className="text-muted-foreground font-medium">
                Face ID verified. Enter the 6-character code sent to <span className="text-foreground font-black">{email}</span>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

              <div className="flex justify-between gap-3 px-2">
                {code.map((char, i) => (
                  <input
                    key={i}
                    id={`code-${i}`}
                    type="text"
                    maxLength={1}
                    autoComplete="off"
                    className="w-full aspect-square bg-card/50 border border-border rounded-2xl text-center text-3xl font-black text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all uppercase placeholder:text-muted-foreground/10"
                    placeholder="0"
                    value={char}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                  />
                ))}
              </div>

              <div className="text-center space-y-6">
                <button
                  type="submit"
                  disabled={loading || code.some(c => !c)}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-[2.5rem] shadow-2xl shadow-primary/30 flex items-center justify-center group transition-all disabled:opacity-50 overflow-hidden relative active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      Verify & Sign In <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <div className="pt-8 border-t border-border space-y-4">
                  <p className="text-muted-foreground text-sm font-medium">Didn't receive a code?</p>
                  <button type="button" className="text-primary hover:text-primary/80 font-black text-[11px] uppercase tracking-widest transition-colors decoration-primary/30 hover:underline underline-offset-4">
                    Resend Verification Email
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Floating Security Note */}
        <div className="mt-12 p-6 bg-card/30 rounded-[2rem] flex items-start gap-4 border border-border backdrop-blur-3xl relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 p-2 shadow-sm border border-foreground/5">
             <img src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
          </div>
          <div className="text-left relative z-10">
            <h4 className="text-foreground text-sm font-black uppercase tracking-widest mb-1">Advanced Protection</h4>
            <p className="text-muted-foreground text-xs leading-relaxed font-medium">
              Marjane Wallet utilizes cutting-edge biometric mapping and one-time tokens to ensure your wealth is protected by industry-leading security protocols.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
}

export default function MFAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <MFAContent />
    </Suspense>
  );
}


