// 1. TAMU UNDANGAN (GUEST NAME FROM URL)
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const guestName = urlParams.get('to');
    const guestNameEl = document.getElementById("guest-name");
    
    if (guestName) {
        // Format nama tamu (decode URL & sanitize)
        guestNameEl.textContent = decodeURIComponent(guestName.replace(/\+/g, ' '));
    }
    
    // Inisialisasi Buku Tamu
    renderWishes();
});

// 2. BUKA UNDANGAN & PLAY MUSIC
const btnOpen = document.getElementById("btn-open");
const cover = document.getElementById("cover");
const mainInvitation = document.getElementById("main-invitation");
const bgMusic = document.getElementById("bg-music");
const musicToggle = document.getElementById("music-toggle");

btnOpen.addEventListener("click", () => {
    // Kunci body dibuka
    document.body.classList.remove("locked");
    mainInvitation.classList.remove("locked");
    
    // Cover slide up & hidden
    cover.classList.add("fade-out");
    
    // Munculkan tombol musik
    musicToggle.classList.remove("hidden");
    
    // Coba putar musik secara otomatis
    playAudio();
    
    // Triger inisialisasi scroll observer
    initScrollObserver();
});

// 3. LOGIKA KONTROL AUDIO (BACKEND MUSIC)
let isPlaying = false;

function playAudio() {
    bgMusic.play().then(() => {
        isPlaying = true;
        musicToggle.classList.add("playing");
    }).catch(err => {
        console.log("Autoplay dicegah oleh browser. User harus berinteraksi dahulu.");
        isPlaying = false;
        musicToggle.classList.remove("playing");
    });
}

function toggleAudio() {
    if (isPlaying) {
        bgMusic.pause();
        musicToggle.classList.remove("playing");
        isPlaying = false;
    } else {
        bgMusic.play();
        musicToggle.classList.add("playing");
        isPlaying = true;
    }
}

musicToggle.addEventListener("click", toggleAudio);

// 4. COUNTDOWN TIMER (TASYAKURAN KHITAN)
// Target: Sabtu, 15 Agustus 2026 09:00 WIB
const targetDate = new Date("Aug 15, 2026 09:00:00").getTime();

const countdownInterval = setInterval(() => {
    const now = new Date().getTime();
    const difference = targetDate - now;

    // Hitung Hari, Jam, Menit, Detik
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    // Update Tampilan DOM
    document.getElementById("days").innerText = String(days).padStart(2, '0');
    document.getElementById("hours").innerText = String(hours).padStart(2, '0');
    document.getElementById("minutes").innerText = String(minutes).padStart(2, '0');
    document.getElementById("seconds").innerText = String(seconds).padStart(2, '0');

    // Jika waktu hitung mundur selesai
    if (difference < 0) {
        clearInterval(countdownInterval);
        document.getElementById("countdown").innerHTML = "<div class='event-started'>Acara Sedang Berlangsung</div>";
    }
}, 1000);

// 5. GOOGLE CALENDAR REDIRECT
document.getElementById("btn-calendar").addEventListener("click", () => {
    const title = encodeURIComponent("Walimatul Khitan Muhammad Azka Al-Fatih");
    const dates = "20260815T020000Z/20260815T100000Z"; // UTC time (09.00 WIB - 17.00 WIB)
    const details = encodeURIComponent("Menghadiri Tasyakuran & Resepsi Khitanan Ananda Muhammad Azka Al-Fatih. Lokasi: Gedung Serbaguna Al-Barokah.");
    const location = encodeURIComponent("Gedung Serbaguna Al-Barokah, Jl. Kebon Jeruk Raya No.12, Jakarta Barat");
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank');
});

// 6. COPY TO CLIPBOARD UTILITY
function copyToClipboard(elementId, bankName) {
    const text = document.getElementById(elementId).innerText;
    
    // Menggunakan API Clipboard Modern jika tersedia
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(`Nomor Rekening ${bankName} berhasil disalin!`);
        }).catch(err => {
            fallbackCopyText(text, bankName);
        });
    } else {
        fallbackCopyText(text, bankName);
    }
}

function fallbackCopyText(text, bankName) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";  // Hindari scroll saat fokus
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast(`Nomor Rekening ${bankName} berhasil disalin!`);
    } catch (err) {
        console.error('Gagal menyalin teks', err);
    }
    
    document.body.removeChild(textArea);
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// Ekspos fungsi salin ke global (window) agar bisa dipanggil dari atribut onclick
window.copyToClipboard = copyToClipboard;

// 7. RSVP FORM & LOCALSTORAGE GUESTBOOK
const rsvpForm = document.getElementById("rsvp-form");
const wishesContainer = document.getElementById("wishes-container");
const wishCountEl = document.getElementById("wish-count");
const guestCountGroup = document.getElementById("guest-count-group");
const rsvpStatus = document.getElementById("rsvp-status");

// Tampilkan/sembunyikan input jumlah tamu berdasarkan pilihan kehadiran
rsvpStatus.addEventListener("change", () => {
    if (rsvpStatus.value === "Hadir") {
        guestCountGroup.classList.remove("hidden");
    } else {
        guestCountGroup.classList.add("hidden");
    }
});

rsvpForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const name = document.getElementById("rsvp-name").value.trim();
    const status = rsvpStatus.value;
    const guests = status === "Hadir" ? document.getElementById("rsvp-guests").value : "0";
    const message = document.getElementById("rsvp-message").value.trim();
    
    if (!name || !status || !message) return;
    
    // Dapatkan data ucapan yang ada
    let wishes = JSON.parse(localStorage.getItem("khitan_wishes")) || [];
    
    // Tambah ucapan baru
    const newWish = {
        id: Date.now(),
        name: sanitizeHTML(name),
        status: status,
        guests: guests,
        message: sanitizeHTML(message),
        time: new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
    };
    
    wishes.unshift(newWish); // Tambahkan ke awal array (terbaru di atas)
    localStorage.setItem("khitan_wishes", JSON.stringify(wishes));
    
    // Reset Form
    rsvpForm.reset();
    guestCountGroup.classList.add("hidden");
    
    // Re-render wishes
    renderWishes();
    
    // Tampilkan notifikasi
    showToast("Terima kasih atas doa & konfirmasinya!");
});

// Render ucapan ke UI
function renderWishes() {
    const wishes = JSON.parse(localStorage.getItem("khitan_wishes")) || [];
    wishCountEl.textContent = wishes.length;
    
    if (wishes.length === 0) {
        wishesContainer.innerHTML = `<div class="empty-wishes">Belum ada ucapan. Jadilah yang pertama memberikan doa restu!</div>`;
        return;
    }
    
    let html = "";
    wishes.forEach(wish => {
        let badgeClass = "badge-hadir";
        let statusText = "Hadir";
        
        if (wish.status === "Ragu") {
            badgeClass = "badge-ragu";
            statusText = "Ragu-ragu";
        } else if (wish.status === "Tidak Hadir") {
            badgeClass = "badge-tidak";
            statusText = "Tidak Hadir";
        }
        
        const guestText = wish.status === "Hadir" ? ` (${wish.guests} Tamu)` : "";
        
        html += `
            <div class="wish-item">
                <div class="wish-header">
                    <span class="wish-name">${wish.name}</span>
                    <span class="wish-badge ${badgeClass}">${statusText}${guestText}</span>
                </div>
                <div class="wish-body">
                    ${wish.message}
                </div>
                <div class="wish-time">
                    ${wish.time}
                </div>
            </div>
        `;
    });
    
    wishesContainer.innerHTML = html;
}

// XSS Sanitizer Helper
function sanitizeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// 8. SCROLL REVEAL & NAVIGATION HIGHLIGHT
function initScrollObserver() {
    const sections = document.querySelectorAll("section");
    const navItems = document.querySelectorAll(".nav-item");
    
    // Intersection Observer untuk animasi masuk (Reveal)
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
            }
        });
    };
    
    const revealObserver = new IntersectionObserver(revealCallback, {
        root: null,
        threshold: 0.15
    });
    
    sections.forEach(section => {
        revealObserver.observe(section);
    });
    
    // Highlight Menu Navigasi sesuai Scroll Pos
    window.addEventListener("scroll", () => {
        let currentSectionId = "";
        const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            // Cek jika scroll berada di area section ini
            if (scrollPosition >= (sectionTop - sectionHeight / 3)) {
                // Jika cover masih aktif (belum diclose), abaikan
                if (section.id === "cover" && !cover.classList.contains("fade-out")) {
                    currentSectionId = "";
                } else {
                    currentSectionId = section.id;
                }
            }
        });
        
        if (currentSectionId) {
            navItems.forEach(item => {
                item.classList.remove("active");
                if (item.getAttribute("href") === `#${currentSectionId}`) {
                    item.classList.add("active");
                }
            });
        }
    });
}

// Logic Navigasi Klik Manual
const navItems = document.querySelectorAll(".nav-item");
navItems.forEach(item => {
    item.addEventListener("click", function(e) {
        navItems.forEach(nav => nav.classList.remove("active"));
        this.classList.add("active");
    });
});

// 9. LIGHTBOX / PHOTO PREVIEW LOGIC
const galleryImages = [
    "assets/gallery_1.png",
    "assets/gallery_2.png",
    "assets/gallery_3.png",
    "assets/gallery_4.png"
];
let currentImageIndex = 0;

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");

function openLightbox(index) {
    currentImageIndex = index;
    lightboxImg.src = galleryImages[currentImageIndex];
    lightbox.classList.remove("hidden");
    document.body.classList.add("locked"); // Kunci scroll agar tidak bergeser di belakang
}

function closeLightbox(event) {
    // Tutup hanya jika diklik di area luar gambar (background) atau tombol close
    if (event.target.id === "lightbox" || event.target.className === "lightbox-close") {
        lightbox.classList.add("hidden");
        document.body.classList.remove("locked");
    }
}

function prevLightbox(event) {
    event.stopPropagation();
    currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    lightboxImg.src = galleryImages[currentImageIndex];
}

function nextLightbox(event) {
    event.stopPropagation();
    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    lightboxImg.src = galleryImages[currentImageIndex];
}

// Ekspos ke global scope agar onclick di HTML dapat memanggilnya
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.prevLightbox = prevLightbox;
window.nextLightbox = nextLightbox;
