class StarRating {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);

        this.starCount = options.starCount || 5;
        this.starSize = options.starSize || 32;
        this.starColor = options.starColor || '#FFD700';
        this.starBackgroundColor = options.starBackgroundColor || '#e0e0e0';
        this.precision = options.precision || 0.5;
        this.rating = options.rating || 0;
        this.readonly = options.readonly || false;

        this.hoverValue = null;
        this.stars = [];

        // Find the popup element (assume it's a sibling of the container's parent)
        this.popup = this.container.parentElement.querySelector('.rating-popup');

        this.init();
    }
    showPopup(value, event) {
        if (!this.popup) return;
        this.popup.textContent = `${value} out of ${this.starCount} stars`;
        this.popup.hidden = false;
        this.popup.classList.add('visible');
        // Position popup near mouse or star
        let x = 0, y = 0;
        if (event && event.clientX && event.clientY) {
            // Mouse event
            const parentRect = this.container.parentElement.getBoundingClientRect();
            x = event.clientX - parentRect.left;
            y = event.clientY - parentRect.top - 36; // 36px above mouse
        } else {
            // Fallback: center above container
            x = this.container.offsetWidth / 2;
            y = -36;
        }
        this.popup.style.left = `${x}px`;
        this.popup.style.top = `${y}px`;
    }

    hidePopup() {
        if (!this.popup) return;
        this.popup.hidden = true;
        this.popup.classList.remove('visible');
    }

    init() {
        this.container.tabIndex = 0;
        this.container.setAttribute('aria-valuemin', 0);
        this.container.setAttribute('aria-valuemax', this.starCount);
        this.container.setAttribute('aria-valuenow', this.rating);

        this.renderStars();
        this.attachEvents();
        this.updateDisplay(this.rating);
    }

    renderStars() {
        this.container.innerHTML = '';
        this.stars = [];

        for (let i = 0; i < this.starCount; i++) {
            const starSpan = document.createElement('span');
            starSpan.className = 'star-radio';
            starSpan.setAttribute('role', 'radio');
            starSpan.setAttribute('aria-checked', 'false');

            const svgData = this.createStarSVG();
            starSpan.innerHTML = svgData.svg;

            const clipRect = starSpan.querySelector('clipPath rect');

            this.stars.push({
                element: starSpan,
                clipRect
            });

            this.container.appendChild(starSpan);
        }
    }

    createStarSVG() {
        const clipId = `clip-${crypto.randomUUID()}`;

        const starPath =
            'M187.27344,228.01147a12.22943,12.22943,0,0,1-6.56739-1.946l-50.43554-31.95386a4.20647,4.20647,0,0,0-4.541,0L78.85937,223.8064a13.648,13.648,0,0,1-15.59082-.49048,14.39145,14.39145,0,0,1-5.47168-15.293l13.51368-53.16016A4.75433,4.75433,0,0,0,69.791,150.047L24.56348,112.40344a12.676,12.676,0,0,1-3.91993-13.74768,12.22556,12.22556,0,0,1,10.9795-8.62268L90.6875,86.19983a4.4467,4.4467,0,0,0,3.78809-2.83472l22.02929-55.47363a12.31785,12.31785,0,0,1,22.99024.00024L161.52441,83.3645a4.44633,4.44633,0,0,0,3.78809,2.83533L224.377,90.03308a12.22557,12.22557,0,0,1,10.9795,8.62268,12.67572,12.67572,0,0,1-3.91993,13.74756L186.209,150.04688a4.75486,4.75486,0,0,0-1.51953,4.81616l14.57227,57.322a12.65708,12.65708,0,0,1-4.81445,13.448A12.17922,12.17922,0,0,1,187.27344,228.01147Z';

        const svg = `
      <svg width="${this.starSize}" height="${this.starSize}" viewBox="0 0 256 256">
        <defs>
          <clipPath id="${clipId}">
            <rect x="0" y="0" width="0" height="256" />
          </clipPath>
        </defs>

        <path d="${starPath}" fill="${this.starBackgroundColor}" />
        <path d="${starPath}" fill="${this.starColor}" clip-path="url(#${clipId})" />
      </svg>
    `;

        return { svg };
    }

    updateDisplay(value) {
                // Show popup if hovering or after rating
                if (this.popup && (this.hoverValue !== null || document.activeElement === this.container)) {
                    this.showPopup(value);
                } else {
                    this.hidePopup();
                }
        const displayValue = Number(value.toFixed(2));

        this.container.setAttribute('aria-valuenow', displayValue);

        this.stars.forEach((star, index) => {
            let fillPercent = 0;

            if (displayValue >= index + 1) {
                fillPercent = 1;
            } else if (displayValue > index) {
                fillPercent = displayValue - index;
            }

            const width = 256 * fillPercent;
            star.clipRect.setAttribute('width', width);

            star.element.setAttribute(
                'aria-checked',
                displayValue >= index + 1 ? 'true' : 'false'
            );
        });
    }

    calculateValueFromEvent(e) {
        const rect = this.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const starWidth = rect.width / this.starCount;

        let value = x / starWidth;
        value = Math.max(0, Math.min(this.starCount, value));
        value = Math.round(value / this.precision) * this.precision;

        return Number(value.toFixed(2));
    }

    attachEvents() {
        if (this.readonly) return;

        this.container.addEventListener('mousemove', (e) => {
            this.hoverValue = this.calculateValueFromEvent(e);
            this.updateDisplay(this.hoverValue);
            this.showPopup(this.hoverValue, e);
        });

        this.container.addEventListener('mouseleave', () => {
            this.hoverValue = null;
            this.updateDisplay(this.rating);
            this.hidePopup();
        });

        this.container.addEventListener('click', (e) => {
            this.rating = this.calculateValueFromEvent(e);
            this.updateDisplay(this.rating);
            this.showPopup(this.rating, e);

            this.container.dispatchEvent(
                new CustomEvent('rating-change', {
                    detail: { value: this.rating }
                })
            );
        });

        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                this.rating = Math.min(
                    this.starCount,
                    this.rating + this.precision
                );
                this.updateDisplay(this.rating);
                this.showPopup(this.rating);
            }

            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                this.rating = Math.max(
                    0,
                    this.rating - this.precision
                );
                this.updateDisplay(this.rating);
                this.showPopup(this.rating);
            }
        });

        // Touch support
        this.container.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            this.hoverValue = this.calculateValueFromEvent(touch);
            this.updateDisplay(this.hoverValue);
            this.showPopup(this.hoverValue, touch);
        });

        this.container.addEventListener('touchend', () => {
            if (this.hoverValue !== null) {
                this.rating = this.hoverValue;
                this.updateDisplay(this.rating);
                this.showPopup(this.rating);
            }
        });
    }
}