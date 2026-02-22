class StarRating {
    static VIEWBOX_SIZE = 24;
    static STAR_PATH =
        'M12 20a1 1 0 0 1-.437-.1C11.214 19.73 3 15.671 3 9a5 5 0 0 1 8.535-3.536l.465.465.465-.465A5 5 0 0 1 21 9c0 6.646-8.212 10.728-8.562 10.9A1 1 0 0 1 12 20z';

        // start svg use viewbox size 256
    // static STAR_PATH =
    //     'M187.27344,228.01147a12.22943,12.22943,0,0,1-6.56739-1.946l-50.43554-31.95386a4.20647,4.20647,0,0,0-4.541,0L78.85937,223.8064a13.648,13.648,0,0,1-15.59082-.49048,14.39145,14.39145,0,0,1-5.47168-15.293l13.51368-53.16016A4.75433,4.75433,0,0,0,69.791,150.047L24.56348,112.40344a12.676,12.676,0,0,1-3.91993-13.74768,12.22556,12.22556,0,0,1,10.9795-8.62268L90.6875,86.19983a4.4467,4.4467,0,0,0,3.78809-2.83472l22.02929-55.47363a12.31785,12.31785,0,0,1,22.99024.00024L161.52441,83.3645a4.44633,4.44633,0,0,0,3.78809,2.83533L224.377,90.03308a12.22557,12.22557,0,0,1,10.9795,8.62268,12.67572,12.67572,0,0,1-3.91993,13.74756L186.209,150.04688a4.75486,4.75486,0,0,0-1.51953,4.81616l14.57227,57.322a12.65708,12.65708,0,0,1-4.81445,13.448A12.17922,12.17922,0,0,1,187.27344,228.01147Z';
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            throw new Error("StarRating: container not found");
        }

        // Config
        this.starCount = options.starCount ?? 5;
        this.starSize = options.starSize ?? 32;
        this.starColor = options.starColor ?? '#FFD700';
        this.starBackgroundColor = options.starBackgroundColor ?? '#e0e0e0';
        this.precision = options.precision ?? 0.5;
        this.rating = this.normalize(options.rating ?? 0);
        this.readonly = !!options.readonly;
        this.rtl = !!options.rtl;

        // State
        this.hoverValue = null;
        this.stars = [];
        this.rectCache = null;
        this.isDragging = false;

        this.popup = this.container.parentElement.querySelector('.rating-popup');
        this.isKeyboardInteracting = false;
        this.init();
    }

    /* ===============================
       Initialization
    =============================== */

    init() {
        this.setupAccessibility();
        this.renderStars();
        if (!this.readonly) this.attachEvents();
        this.updateDisplay(this.rating);
    }

    setupAccessibility() {
        this.container.setAttribute('role', 'slider');
        this.container.setAttribute('tabindex', this.readonly ? '-1' : '0');
        this.container.setAttribute('aria-valuemin', 0);
        this.container.setAttribute('aria-valuemax', this.starCount);
        this.updateAria(this.rating);
    }

    updateAria(value) {
        this.container.setAttribute('aria-valuenow', value);
        this.container.setAttribute(
            'aria-valuetext',
            `${value} out of ${this.starCount} stars`
        );
    }

    /* ===============================
       Rendering
    =============================== */

    renderStars() {
        this.container.innerHTML = '';
        this.stars = [];
        const size = StarRating.VIEWBOX_SIZE;

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < this.starCount; i++) {
            const starSpan = document.createElement('span');
            starSpan.className = 'star-slide';

            const clipId = `clip-${crypto.randomUUID()}`;

            starSpan.innerHTML = `
                <svg width="${this.starSize}" height="${this.starSize}" viewBox="0 0 ${size} ${size}">
                    <defs>
                        <clipPath id="${clipId}">
                            <rect x="0" y="0" width="0" height="${size}" />
                        </clipPath>
                    </defs>
                    <path d="${StarRating.STAR_PATH}" fill="${this.starBackgroundColor}" />
                    <path d="${StarRating.STAR_PATH}" fill="${this.starColor}" clip-path="url(#${clipId})" />
                </svg>
            `;

            const clipRect = starSpan.querySelector('clipPath rect');

            this.stars.push({ element: starSpan, clipRect });
            fragment.appendChild(starSpan);
        }

        this.container.appendChild(fragment);
    }

    updateDisplay(value) {
        const displayValue = this.normalize(value);

        if (this._lastRendered === displayValue) return;
        this._lastRendered = displayValue;

        this.updateAria(displayValue);

        this.stars.forEach((star, index) => {
            let fillPercent = 0;

            if (displayValue >= index + 1) fillPercent = 1;
            else if (displayValue > index) fillPercent = displayValue - index;

            star.clipRect.setAttribute('width', `${StarRating.VIEWBOX_SIZE}` * fillPercent);
        });

        if (this.hoverValue !== null || this.isKeyboardInteracting) {
            this.showPopup(displayValue);
            console.log("show popup")
        } else {
            this.hidePopup();
        }
    }

    /* ===============================
       Pointer Handling (Unified)
    =============================== */

    attachEvents() {
        this.handlePointerDown = (e) => {
            this.cacheRect();
            this.isDragging = true;
            this.container.setPointerCapture?.(e.pointerId);
            this.handlePointerMove(e);
        };

        this.handlePointerMove = (e) => {
            if (!this.isDragging && e.type !== 'pointermove') return;

            const value = this.calculateFromPointer(e);
            this.hoverValue = value;
            this.updateDisplay(value);
        };

        this.handlePointerUp = (e) => {
            if (!this.isDragging) return;

            this.isDragging = false;
            this.container.releasePointerCapture?.(e.pointerId);

            if (this.hoverValue !== null) {
                this.rating = this.hoverValue;
                this.hoverValue = null;
                this.updateDisplay(this.rating);
                this.dispatchChange();
            }
        };

        this.handlePointerLeave = () => {
            this.hoverValue = null;
            this.updateDisplay(this.rating);
        };

        this.handleKeyDown = (e) => {
            this.isKeyboardInteracting = true;
            let newValue = this.rating;

            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowUp':
                    newValue += this.precision;
                    break;
                case 'ArrowLeft':
                case 'ArrowDown':
                    newValue -= this.precision;
                    break;
                case 'Home':
                    newValue = 0;
                    break;
                case 'End':
                    newValue = this.starCount;
                    break;
                default:
                    return;
            }

            this.rating = this.normalize(newValue);
            this.updateDisplay(this.rating);
            this.dispatchChange();
        };

        this.handleBlur = () => {
            this.isKeyboardInteracting = false;
            this.hidePopup();
        };

        this.container.addEventListener('pointerdown', this.handlePointerDown);
        this.container.addEventListener('pointermove', this.handlePointerMove);
        this.container.addEventListener('pointerup', this.handlePointerUp);
        this.container.addEventListener('pointerleave', this.handlePointerLeave);
        this.container.addEventListener('keydown', this.handleKeyDown);
        this.container.addEventListener('blur', this.handleBlur);
    }

    cacheRect() {
        this.rectCache = this.container.getBoundingClientRect();
    }

    calculateFromPointer(e) {
        const rect = this.rectCache || this.container.getBoundingClientRect();
        let x = e.clientX - rect.left;

        if (this.rtl) {
            x = rect.width - x;
        }

        let value = (x / rect.width) * this.starCount;
        return this.normalize(value);
    }

    /* ===============================
       Popup
    =============================== */

    showPopup(value) {
        if (!this.popup) return;

        this.popup.textContent = `${value} out of ${this.starCount} stars`;
        this.popup.hidden = false;
        this.popup.classList.add('visible');

        const containerRect = this.container.getBoundingClientRect();
        const parentRect = this.container.parentElement.getBoundingClientRect();

        const left = containerRect.left - parentRect.left + containerRect.width / 2;
        const top = containerRect.top - parentRect.top - 36;

        this.popup.style.left = `${left}px`;
        this.popup.style.top = `${top}px`;
    }

    hidePopup() {
        if (!this.popup) return;
        this.popup.hidden = true;
        this.popup.classList.remove('visible');
    }

    /* ===============================
       Utilities
    =============================== */

    normalize(v) {
        const rounded = Math.round(v / this.precision) * this.precision;
        return Math.min(
            this.starCount,
            Math.max(0, Number(rounded.toFixed(4)))
        );
    }

    dispatchChange() {
        this.container.dispatchEvent(
            new CustomEvent('rating-change', {
                detail: { value: this.rating }
            })
        );
    }

    /* ===============================
       Lifecycle
    =============================== */

    destroy() {
        this.hidePopup();

        this.container.removeEventListener('pointerdown', this.handlePointerDown);
        this.container.removeEventListener('pointermove', this.handlePointerMove);
        this.container.removeEventListener('pointerup', this.handlePointerUp);
        this.container.removeEventListener('pointerleave', this.handlePointerLeave);
        this.container.removeEventListener('keydown', this.handleKeyDown);
        this.container.removeEventListener('blur', this.handleBlur)
        this.container.innerHTML = '';

        this.stars = [];
        this.rectCache = null;
    }
}