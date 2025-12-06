import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-blue-900 sm:text-6xl">
          Açık Uçlu Sınav Sistemi
        </h1>
        <p className="max-w-2xl text-lg text-gray-600">
          Yapay zeka destekli analizler ile öğrencilerinizi daha iyi anlayın.
          Klasik sınavların ötesine geçin.
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-full bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Giriş Yap
          </Link>
        </div>
      </main>
    </div>
  );
}
