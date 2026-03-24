import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
            <div className="text-center space-y-6 p-8 max-w-md">
                <div className="text-8xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">404</div>
                <h1 className="text-2xl font-bold text-slate-800">Page Not Found</h1>
                <p className="text-slate-500">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
                <div className="flex items-center justify-center gap-3">
                    <Link href="/" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-medium hover:shadow-lg transition-all">
                        Go Home
                    </Link>
                    <Link href="/auth/login" className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all">
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
