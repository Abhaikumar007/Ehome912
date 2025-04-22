document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('searchBar');
    const subjectGrid = document.getElementById('subjectGrid');
    const subjectCards = subjectGrid.getElementsByClassName('subject-card');

    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();

        Array.from(subjectCards).forEach(card => {
            const subjectNameElement = card.querySelector('.subject-name');
            const subjectDetailElement = card.querySelector('.subject-detail'); // Get detail element too
            let cardText = '';

            if (subjectNameElement) {
                cardText += subjectNameElement.textContent.toLowerCase();
            }
             if (subjectDetailElement) { // Include details in search if they exist
                 cardText += ' ' + subjectDetailElement.textContent.toLowerCase();
             }

            // Basic check if card text includes the search term
            if (cardText.includes(searchTerm)) {
                card.style.display = 'flex'; // Show the card (use 'flex' as defined in CSS)
            } else {
                card.style.display = 'none';  // Hide the card
            }
        });
    });
});