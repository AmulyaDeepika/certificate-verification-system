import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../services/api';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, Search, QrCode, Download,
  XCircle, AlertTriangle, ArrowRight, Check 
} from 'lucide-react';

const VerifyPage = () => {
  const { certId: paramCertId } = useParams();
  const navigate = useNavigate();

  const [inputCertId, setInputCertId] = useState(paramCertId || '');
  const [certData, setCertData] = useState(null);
  const [statusState, setStatusState] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  const verifyId = useCallback(async (idToVerify) => {
    if (!idToVerify || !idToVerify.trim()) return;
    setStatusState('LOADING');
    setCertData(null);
    setStatusMessage('');

    try {
      const cleanId = idToVerify.trim();
      const res = await api.get(`/public/verify/${encodeURIComponent(cleanId)}/?method=MANUAL_ID`);
      setCertData(res.data.certificate);
      setStatusState(
        res.data.valid
          ? 'ACTIVE'
          : res.data.certificate?.status === 'ACTIVE'
            ? 'EXPIRED'
            : res.data.status
      );
      setStatusMessage(res.data.message);

      if (res.data.valid) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setStatusState(err.response?.status === 404 ? 'NOT_FOUND' : 'ERROR');
      setStatusMessage(
        err.response?.data?.message ||
        (err.response?.status === 404
          ? 'This certificate ID was not found in the registry.'
          : 'The verification service is unavailable. Please try again.')
      );
    }
  }, []);

  useEffect(() => {
    if (paramCertId) {
      void Promise.resolve().then(() => verifyId(paramCertId));
    }
  }, [paramCertId, verifyId]);

  useEffect(() => {
    if (!scanning) return undefined;

    let scanner;
    let cancelled = false;
    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        scanner = new Html5Qrcode('certificate-qr-reader');
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (cancelled) return;
            let certificateId = decodedText.trim();
            try {
              const parsedUrl = new URL(decodedText);
              const match = parsedUrl.pathname.match(/\/verify\/([^/]+)/);
              if (match) certificateId = decodeURIComponent(match[1]);
            } catch {
              // A QR code may contain a certificate ID directly.
            }
            if (!certificateId) return;
            setInputCertId(certificateId);
            setScanning(false);
            navigate(`/verify/${encodeURIComponent(certificateId)}`);
          },
          () => {}
        );
        if (cancelled && scanner.isScanning) {
          await scanner.stop();
          scanner.clear();
        }
      } catch {
        if (!cancelled) {
          setScanError('Could not access the camera. Allow camera access or enter the certificate ID.');
          setScanning(false);
        }
      }
    };

    startScanner();
    return () => {
      cancelled = true;
      if (scanner?.isScanning) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
  }, [scanning, navigate]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputCertId.trim()) {
      navigate(`/verify/${encodeURIComponent(inputCertId.trim())}`, { replace: true });
    }
  };

  const handleDownloadPdf = () => {
    if (!certData?.certificate_id) return;
    window.open(
      `${API_BASE_URL}/public/download/${encodeURIComponent(certData.certificate_id)}/`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      
      {/* Top Banner Bar matching Mockup */}
      <div className="bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-xl text-blue-950">CertVerify</span>
        </Link>

        <div className="hidden sm:flex items-center space-x-6 text-xs font-bold text-slate-600">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <Link to="/about" className="hover:text-blue-600">About</Link>
          <Link to="/verify" className="text-blue-600 font-black">Verify Certificate</Link>
          <Link to="/login" className="hover:text-blue-600">Login</Link>
          <Link to="/register" className="hover:text-blue-600">Register</Link>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
        >
          <span>Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Container Card */}
      <div className="max-w-5xl mx-auto p-6 sm:p-10">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12">
          
          {/* Header Title with Blue Shield Icon */}
          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">Verify Certificate</h2>
              <p className="text-xs text-slate-500">Enter Certificate ID or scan QR Code to verify</p>
            </div>
          </div>

          {/* Verification Search Bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mt-6 mb-8">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputCertId}
                onChange={(e) => setInputCertId(e.target.value)}
                placeholder="Enter Certificate ID..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Verify</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setScanError('');
                setScanning((active) => !active);
              }}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{scanning ? 'Close scanner' : 'Scan QR'}</span>
            </button>
          </form>

          {scanError && <p role="alert" className="mb-5 text-sm text-rose-700">{scanError}</p>}
          {scanning && (
            <div className="mb-6">
              <div id="certificate-qr-reader" className="max-w-md mx-auto" />
              <button
                type="button"
                onClick={() => setScanning(false)}
                className="mt-2 text-sm font-semibold text-blue-700 underline"
              >
                Stop camera
              </button>
            </div>
          )}

          {/* Grid: Left Result Card + Right QR Box matching Mockup */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Left Result Column (8 cols) */}
            <div className="md:col-span-8">
              {/* VALID CERTIFICATE CARD (Light Green Background matching Mockup) */}
              {statusState === 'ACTIVE' && certData && (
                <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
                  {/* Green Check Pill */}
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-lg mb-5">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span>Certificate is Valid!</span>
                  </div>

                  {/* Metadata table matching mockup */}
                  <div className="space-y-2.5 text-sm">
                    <div className="flex">
                      <span className="w-36 font-bold text-slate-600">Student Name</span>
                      <span className="text-slate-800 font-bold">: {certData.student_name}</span>
                    </div>

                    <div className="flex">
                      <span className="w-36 font-bold text-slate-600">Course</span>
                      <span className="text-slate-800 font-bold">: {certData.course_name}</span>
                    </div>

                    <div className="flex">
                      <span className="w-36 font-bold text-slate-600">Institution</span>
                      <span className="text-slate-800 font-bold">: {certData.institution_name}</span>
                    </div>

                    <div className="flex">
                      <span className="w-36 font-bold text-slate-600">Issue Date</span>
                      <span className="text-slate-800 font-bold">: {certData.issue_date}</span>
                    </div>
                  </div>

                  {/* Download Action inside card */}
                  <div className="mt-6 pt-4 border-t border-emerald-200/60 flex justify-end">
                    <button
                      onClick={handleDownloadPdf}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Certificate PDF</span>
                    </button>
                  </div>
                </div>
              )}

              {/* INVALID / REVOKED RESULT */}
              {statusState === 'REVOKED' && certData && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-rose-800 font-black text-lg">
                    <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs">
                      <XCircle className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span>Certificate is Revoked / Invalid!</span>
                  </div>

                  <p className="text-xs text-rose-700 font-medium">
                    Reason: <strong>{certData.revocation_reason || 'Academic revocation'}</strong>
                  </p>

                  <div className="space-y-2 text-sm text-slate-700">
                    <div>Student: <strong>{certData.student_name}</strong></div>
                    <div>Institution: <strong>{certData.institution_name}</strong></div>
                  </div>
                </div>
              )}

              {['INACTIVE', 'EXPIRED'].includes(statusState) && certData && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-black text-lg">
                    <AlertTriangle className="w-6 h-6" />
                    <span>Certificate {statusState === 'EXPIRED' ? 'Expired' : 'Inactive'}</span>
                  </div>
                  <p className="text-sm text-amber-800">{statusMessage}</p>
                  <p className="text-sm text-slate-700">
                    Holder: <strong>{certData.student_name}</strong> · {certData.institution_name}
                  </p>
                </div>
              )}

              {statusState === 'ERROR' && (
                <div role="alert" className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900">
                  <AlertTriangle className="w-6 h-6 mb-2" />
                  <p className="font-bold">Verification unavailable</p>
                  <p className="text-sm">{statusMessage}</p>
                </div>
              )}

              {statusState === 'LOADING' && (
                <p role="status" className="text-sm font-semibold text-blue-800">Checking the certificate registry...</p>
              )}

              {/* NOT FOUND RESULT */}
              {statusState === 'NOT_FOUND' && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-7 shadow-xs text-center space-y-3">
                  <XCircle className="w-10 h-10 text-rose-600 mx-auto" />
                  <h3 className="text-lg font-bold text-rose-900">Certificate Not Found</h3>
                  <p className="text-xs text-rose-700 max-w-sm mx-auto">
                    The requested Certificate ID does not exist in the institutional registry.
                  </p>
                </div>
              )}

              {/* Bottom Authentic Badge matching Mockup */}
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Authentic Certificate • Verified by CertVerify</span>
              </div>
            </div>

            {/* Right QR Box (4 cols matching Mockup) */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-200 text-center">
              <div className="bg-white p-3 rounded-2xl shadow-md border-2 border-cyan-400 mb-4">
                {certData?.qr_code ? (
                  <img
                    src={`${API_BASE_URL.replace(/\/api\/?$/, '')}${certData.qr_code}`}
                    alt="Certificate QR"
                    className="w-36 h-36 object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 bg-blue-900 rounded-xl flex items-center justify-center text-white">
                    <QrCode className="w-20 h-20 text-cyan-400" />
                  </div>
                )}
              </div>

              <h4 className="text-sm font-black text-blue-900">Scan QR Code</h4>
              <p className="text-xs text-blue-600 font-bold mt-0.5">for Instant Verification</p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
