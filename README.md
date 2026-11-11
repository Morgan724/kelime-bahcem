# Kelime Bahçem

Çocuklara yönelik görsel hafıza odaklı A1 İngilizce kelime oyunu. Türkçe açıklamalar, resimli kelime kartları, sesli telaffuz, eşleştirme ve çoktan seçmeli mini oyunlar içerir.

## Kullanım

`index.html` dosyasını açarak uygulamayı kullanabilirsiniz. İlerleme aynı tarayıcı ve cihazda saklanır. Sesli telaffuz tarayıcının kendi konuşma özelliğini kullanır; harici servis çağrısı yapmaz. Bir web sunucusunda açıldığında uygulama çevrimdışı kullanım için dosyalarını önbelleğe alır.

## Ücretsiz internette yayınlama

Uygulama statik HTML, CSS ve JavaScript dosyalarından oluşur; derleme veya paket kurma adımı yoktur. Örneğin GitHub Pages, GitHub Free hesabında herkese açık bir depodan ücretsiz yayın yapabilir. Siteyi yayınlamak için bu klasörün içeriğini bir GitHub deposunun köküne yükleyin; depoda **Settings → Pages → Deploy from a branch** bölümünden `main` dalını ve `/ (root)` klasörünü seçin. Yayınlanan adres `https://KULLANICI.github.io/DEPO-ADI/` biçiminde olur.

GitHub Pages siteleri herkese açıktır. Uygulama kullanıcı hesabı açmaz ve ilerleme verisini yalnızca ziyaretçinin tarayıcısında saklar.

## Dosyalar

- `index.html` — uygulama iskeleti
- `styles.css` — duyarlı tasarım ve küçük animasyonlar
- `app.js` — kelime içeriği, oyunlar ve yerel ilerleme
- `manifest.webmanifest`, `sw.js`, `icon.svg` — ana ekrana ekleme ve çevrimdışı önbellek desteği
