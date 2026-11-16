import { useState, useEffect } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import api from "./services/api";

const OTP_SECONDS = 60;

export default function VerifyOTP() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email;

  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(OTP_SECONDS);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (seconds <= 0 || success) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, success]);

  // email lekunda direct ga ee page open chesthe register ki pampu
  if (!email) return <Navigate to="/register" replace />;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register/verify-otp/", { email, otp });
      setSuccess("OTP successful ✅ Redirecting to login...");
      setTimeout(
        () => navigate("/login", { state: { message: "Email verified. Please login." } }),
        1500
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await api.post("/auth/register/resend-otp/", { email });
      setOtp("");
      setSeconds(OTP_SECONDS);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not resend OTP.");
    }
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div style={{ maxWidth: 380, margin: "60px auto", padding: 24 }}>
      <h2>Verify your email</h2>
      <p>
        We sent a 6-digit code to <b>{email}</b>
      </p>

      <form onSubmit={handleVerify}>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          maxLength={6}
          inputMode="numeric"
          placeholder="Enter 6-digit OTP"
          disabled={!!success}
          style={{ width: "100%", padding: 10, fontSize: 18, letterSpacing: 4 }}
        />
        <button
          type="submit"
          disabled={loading || otp.length !== 6 || seconds <= 0 || !!success}
          style={{ width: "100%", padding: 10, marginTop: 12 }}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>

      {!success &&
        (seconds > 0 ? (
          <p>
            Code expires in {mm}:{ss}
          </p>
        ) : (
          <p>
            Code expired.{" "}
            <button type="button" onClick={handleResend}>
              Resend OTP
            </button>
          </p>
        ))}

      {success && <p style={{ color: "green" }}>{success}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}