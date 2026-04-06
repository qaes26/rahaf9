// Simplified Memory Gallery - Main JS Logic
// Only handles soft animations and interactive highlights

document.addEventListener('DOMContentLoaded', () => {
    console.log("Memory Gallery Loaded - For Rahaf 💖");
    
    // Animate memory cards on scroll
    const memoryCards = document.querySelectorAll('.memory-card');
    
    const revealOnScroll = () => {
        memoryCards.forEach(card => {
            const cardTop = card.getBoundingClientRect().top;
            const revealPoint = window.innerHeight - 150;
            
            if (cardTop < revealPoint) {
                card.classList.add('visible');
            }
        });
    };
    
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check
});
