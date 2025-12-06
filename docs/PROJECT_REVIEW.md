# Proje İncelemesi

## Genel Bakış
- **Çatılar:** Uygulama Next.js App Router, TypeScript ve Tailwind CSS üzerinde kurulmuş. Firebase Authentication, Firestore ve Storage ile entegre olup `.env` ortam değişkenleri `src/lib/firebase.ts` içinde okunuyor.
- **Tema:** Arayüzler Türkçe içeriklerle eğitim odaklı hazırlanmış; öğrenci, öğretmen ve yönetici rollerini destekleyen bir sınav platformu.

## Kimlik Doğrulama ve Yetkilendirme
- `AuthProvider`, Firebase oturumunu dinleyip kullanıcıyı ve Firestore'daki profil verisini `AuthContext` ile dağıtıyor; çıkışta `/login` rotasına yönlendiriyor.【F:src/contexts/AuthContext.tsx†L1-L58】
- Giriş/kayıt ekranı hem öğretmenler hem öğrenciler için tek sayfada sunuluyor. Öğrenci kayıtlarında sınav numarasından üretilen e-posta ile hesap oluşturulup Firestore'da rol, okul ve sınıf bilgileri saklanıyor.【F:src/app/(auth)/login/page.tsx†L1-L111】

## Panel Deneyimleri
- **Öğretmen Paneli:** Kullanıcıya ait sınavlar Firestore'dan öğretmen kimliğine göre çekiliyor, oluşturma bağlantısı ve sınav detay linkleri sunuluyor; sınav linki kopyalama kısayolu içeriyor.【F:src/app/(dashboard)/teacher/page.tsx†L1-L90】
- **Öğrenci Paneli:** Öğrencinin gönderimleri `submissions` koleksiyonundan toplanıp ilgili sınav başlığıyla listeleniyor; analiz bekleyen ve skorlanmış durumlar rozette gösteriliyor.【F:src/app/(dashboard)/student/page.tsx†L1-L90】

## Veri Modelleri
- Sınav yapısı soru tipleri (metin, görsel, ses, video), puanlama ve süre ayarlarını kapsıyor; gönderimler ve yapay zeka analiz sonuçları için tipler tanımlı.【F:src/types/exam.ts†L1-L41】
- Kullanıcı modelinde admin, öğretmen ve öğrenci rolleri ile okul ve sınıf bilgilerinin tutulduğu Firestore profili şeması yer alıyor.【F:src/types/user.ts†L1-L9】

## Güçlü Yanlar
- Firebase entegrasyonu tek dosyada merkezi; App Router ile kapsamlı kimlik durumu sağlayan bağlam bileşeni mevcut.
- Paneller rol bazlı listeleri ve hızlı eylemleri (link kopyalama, sonuç görüntüleme) sade biçimde sunuyor.

## İyileştirme Fırsatları
- Öğrenci kayıt/giriş akışı sahte e-posta üretimine dayanıyor; çoklu okul senaryoları veya gerçek iletişim ihtiyaçları için e-posta doğrulaması ve kullanıcı adı/şifre politikaları netleştirilebilir.
- Firestore sorgularında hata yakalama kullanıcıya bildirilmediğinden, hata durumlarında görünür uyarılar ve yeniden deneme seçenekleri eklenebilir.
- Sınav ve gönderim sorgularında önbellekleme veya yükleme iskeletleri kullanılarak algılanan performans artırılabilir; büyük koleksiyonlar için sayfalama planlanabilir.
- Yapay zeka analizi alanları tanımlı olsa da analiz üretim akışı bulunmuyor; arka plan işleyicileri veya webhook tabanlı değerlendirme süreci eklenebilir.
