(function () {
    'use strict';

    const PHOTO_BASE    = '/photos/img/';
    const GRID_PAGE_SIZE = 24;
    const MONTHS = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];
    const DAY_HEADERS       = ['Mo','Tu','We','Th','Fr','Sa','Su'];
    const DAY_HEADERS_FULL  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

    // Tracks the current calendar state so the toggle button can restore the right breadcrumb
    let calendarState = { year: null, month: null, day: null };

    // Full photo list (chronological) and aggregate stats loaded from photos.json
    let allPhotos          = [];
    let cameraCount        = 0;
    let cameraData         = {};   // { "Sony DSC-W690": ["file.jpg", ...], ... }
    let fileToCamera       = {};   // reverse map: "file.jpg" -> "Sony DSC-W690"
    let activeCameraFilter = null; // null = all cameras

    function pad2(n) { return String(n).padStart(2, '0'); }

    // Return the key (output of keyFn) that appears most in the photos array
    function mostActive(photos, keyFn) {
        const counts = {};
        photos.forEach(function (f) {
            const k = keyFn(f);
            counts[k] = (counts[k] || 0) + 1;
        });
        return Object.entries(counts).sort(function (a, b) { return b[1] - a[1]; })[0]?.[0];
    }

    // Build a small DOM element for a context-aware stats line
    function makeStatsEl(text) {
        const el = document.createElement('p');
        el.className = 'photos-stats';
        el.textContent = text;
        return el;
    }

    // Build the camera filter <select> and inject it into the controls bar
    function buildCameraFilter() {
        const names = Object.keys(cameraData).sort();
        if (names.length <= 1) return; // not useful with only one camera

        const wrap   = document.createElement('div');
        wrap.className = 'camera-filter-wrap';
        wrap.id        = 'camera-filter-wrap';

        const lbl   = document.createElement('label');
        lbl.className   = 'camera-filter-label';
        lbl.htmlFor     = 'camera-select';
        lbl.textContent = 'Camera:';

        const sel   = document.createElement('select');
        sel.className = 'camera-select';
        sel.id        = 'camera-select';

        const allOpt = document.createElement('option');
        allOpt.value       = '';
        allOpt.textContent = 'All';
        sel.appendChild(allOpt);

        names.forEach(function (name) {
            const opt = document.createElement('option');
            opt.value       = name;
            opt.textContent = name;
            sel.appendChild(opt);
        });

        sel.addEventListener('change', function () {
            activeCameraFilter = sel.value || null;
            applyFilter();
        });

        wrap.appendChild(lbl);
        wrap.appendChild(sel);

        const container = document.getElementById('camera-filter-container');
        if (container) container.appendChild(wrap);
    }

    function applyFilter() {
        if (activeCameraFilter && cameraData[activeCameraFilter]) {
            gridAllPhotos = cameraData[activeCameraFilter].slice().reverse();
        } else {
            gridAllPhotos = allPhotos.slice().reverse();
        }
        gridCurrentPage = 1;
        surprisePhotos  = gridAllPhotos.slice();
        renderGridPage();
    }

    function setCameraFilterVisible(visible) {
        const container = document.getElementById('camera-filter-container');
        if (container) container.style.display = visible ? '' : 'none';
    }

    function parseFilename(f) {
        const m = f.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
        if (!m) return null;
        return {
            year: +m[1], month: +m[2], day: +m[3],
            hour: +m[4], min: +m[5], sec: +m[6],
            key: m[1] + '-' + m[2] + '-' + m[3]
        };
    }

    function formatTimestamp(d) {
        return d.year + '-' + pad2(d.month) + '-' + pad2(d.day) + ' ' +
               pad2(d.hour) + ':' + pad2(d.min) + ':' + pad2(d.sec);
    }

    function groupByDate(photos) {
        const map = {};
        for (const f of photos) {
            const d = parseFilename(f);
            if (!d) continue;
            (map[d.key] = map[d.key] || []).push(f);
        }
        return map;
    }

    function getYears(photos) {
        return [...new Set(photos.map(f => parseFilename(f)?.year).filter(Boolean))].sort((a, b) => a - b);
    }

    // ---- Lightbox ----
    let lb = null, lbList = [], lbIdx = 0;

    function buildLightbox() {
        const el = document.createElement('div');
        el.id = 'photo-lightbox';
        el.className = 'lightbox';
        el.setAttribute('aria-hidden', 'true');
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', 'Image viewer');
        el.innerHTML =
            '<div class="lightbox-content">' +
                '<button class="lightbox-close" aria-label="Close image viewer">×</button>' +
                '<div class="lightbox-counter" aria-live="polite" aria-atomic="true"></div>' +
                '<button class="lightbox-nav lightbox-prev" aria-label="Previous image">‹</button>' +
                '<button class="lightbox-nav lightbox-next" aria-label="Next image">›</button>' +
                '<img class="lightbox-image" alt="">' +
                '<div class="lightbox-caption"></div>' +
            '</div>';
        document.body.appendChild(el);

        lb = {
            el,
            img:     el.querySelector('.lightbox-image'),
            caption: el.querySelector('.lightbox-caption'),
            counter: el.querySelector('.lightbox-counter'),
            close:   el.querySelector('.lightbox-close'),
            prev:    el.querySelector('.lightbox-prev'),
            next:    el.querySelector('.lightbox-next'),
        };

        lb.close.addEventListener('click', closeLb);
        lb.img.addEventListener('click', closeLb);
        lb.prev.addEventListener('click', () => moveLb(-1));
        lb.next.addEventListener('click', () => moveLb(1));
        el.addEventListener('click', function (e) { if (e.target === this) closeLb(); });

        document.addEventListener('keydown', function (e) {
            if (!lb.el.classList.contains('active')) return;
            if (e.key === 'Escape')     closeLb();
            if (e.key === 'ArrowLeft')  moveLb(-1);
            if (e.key === 'ArrowRight') moveLb(1);
        });

        let touchStartX = 0;
        el.addEventListener('touchstart', function (e) { touchStartX = e.changedTouches[0].screenX; });
        el.addEventListener('touchend', function (e) {
            const diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) moveLb(diff > 0 ? 1 : -1);
        });
    }

    function openLb(list, idx) {
        lbList = list; lbIdx = idx;
        updateLb();
        lb.el.classList.add('active');
        lb.el.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lightbox-open');
        lb.close.focus();
    }

    function closeLb() {
        lb.el.classList.remove('active');
        lb.el.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lightbox-open');
    }

    function moveLb(dir) {
        lbIdx = (lbIdx + dir + lbList.length) % lbList.length;
        updateLb();
    }

    function updateLb() {
        const f      = lbList[lbIdx];
        const d      = parseFilename(f);
        const camera = fileToCamera[f];
        let caption  = d ? formatTimestamp(d) : f;
        if (camera) caption += ' · ' + camera;
        lb.img.src = PHOTO_BASE + f;
        lb.caption.textContent = caption;
        const multi = lbList.length > 1;
        lb.counter.textContent = multi ? (lbIdx + 1) + ' / ' + lbList.length : '';
        lb.counter.style.display = multi ? 'block' : 'none';
        lb.prev.style.display    = multi ? 'block' : 'none';
        lb.next.style.display    = multi ? 'block' : 'none';
    }

    // ---- Grid view ----
    let gridAllPhotos  = [];
    let gridCurrentPage = 1;
    let surprisePhotos = [];

    function renderGrid(photos) {
        gridAllPhotos   = photos.slice().reverse(); // newest first
        gridCurrentPage = 1;
        surprisePhotos  = gridAllPhotos.slice();
        renderGridPage();
    }

    function renderGridPage() {
        const wrap = document.getElementById('grid-view');
        wrap.innerHTML = '';

        const totalPages = Math.ceil(gridAllPhotos.length / GRID_PAGE_SIZE);
        const start      = (gridCurrentPage - 1) * GRID_PAGE_SIZE;
        const end        = Math.min(start + GRID_PAGE_SIZE, gridAllPhotos.length);
        const pagePhotos = gridAllPhotos.slice(start, end);

        // "Showing 1–24 of 138"
        const countEl = document.createElement('p');
        countEl.className = 'photos-count';
        countEl.textContent = 'Showing ' + (start + 1) + '–' + end + ' of ' + gridAllPhotos.length;
        wrap.appendChild(countEl);

        const grid = document.createElement('div');
        grid.className = 'photos-grid';

        pagePhotos.forEach(function (f, i) {
            const item = document.createElement('div');
            item.className = 'photo-item';

            const img = document.createElement('img');
            img.loading = 'lazy';
            img.src = PHOTO_BASE + f;
            img.alt = '';

            const d = parseFilename(f);
            img.addEventListener('error', function () {
                img.style.display = 'none';
                const ph = document.createElement('div');
                ph.className = 'photo-placeholder';
                ph.textContent = d ? d.year + '-' + pad2(d.month) + '-' + pad2(d.day) : f;
                item.appendChild(ph);
            });

            item.appendChild(img);
            // Global index so lightbox navigation works across pages
            const globalIdx = start + i;
            item.addEventListener('click', function () { openLb(gridAllPhotos, globalIdx); });
            grid.appendChild(item);
        });

        wrap.appendChild(grid);

        if (totalPages > 1) {
            wrap.appendChild(buildPagination(totalPages));
        }

        // Stats line: warm full sentence below the pagination
        if (gridAllPhotos.length) {
            const years   = gridAllPhotos.map(function (f) { return parseInt(f.slice(0, 4)); });
            const minYear = Math.min.apply(null, years);
            const maxYear = Math.max.apply(null, years);
            const total   = gridAllPhotos.length;
            const range   = minYear === maxYear
                            ? 'from ' + minYear
                            : 'ranging from ' + minYear + ' to ' + maxYear;
            let text;

            if (activeCameraFilter) {
                // Filtered view: mention the camera by name
                text = 'This gallery is home to ' + total + ' photo' + (total !== 1 ? 's' : '') +
                       ' from the ' + activeCameraFilter + ' ' + range + '.';
            } else {
                // Full collection
                text = 'This gallery is home to ' + total + ' photo' + (total !== 1 ? 's' : '') +
                       ' ' + range;
                if (cameraCount > 1)     text += ' from ' + cameraCount + ' different cameras.';
                else if (cameraCount === 1) text += ' from 1 camera.';
                else                     text += '.';
            }

            wrap.appendChild(makeStatsEl(text));
        }
    }

    function buildPagination(totalPages) {
        const nav = document.createElement('div');
        nav.className = 'pagination';
        nav.setAttribute('aria-label', 'Photo pages');

        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = '←';
        prevBtn.disabled = gridCurrentPage <= 1;
        prevBtn.setAttribute('aria-label', 'Previous page');
        prevBtn.addEventListener('click', function () {
            if (gridCurrentPage > 1) {
                gridCurrentPage--;
                renderGridPage();
                scrollToGrid();
                updateBreadcrumb('grid');
            }
        });
        nav.appendChild(prevBtn);

        getPageButtons(gridCurrentPage, totalPages).forEach(function (p) {
            if (p === '...') {
                const el = document.createElement('span');
                el.className = 'pagination-ellipsis';
                el.textContent = '…';
                nav.appendChild(el);
            } else {
                const btn = document.createElement('button');
                btn.className = 'pagination-btn' + (p === gridCurrentPage ? ' active' : '');
                btn.textContent = p;
                btn.setAttribute('aria-label', 'Page ' + p);
                if (p === gridCurrentPage) btn.setAttribute('aria-current', 'page');
                btn.addEventListener('click', function () {
                    gridCurrentPage = p;
                    renderGridPage();
                    scrollToGrid();
                    updateBreadcrumb('grid');
                });
                nav.appendChild(btn);
            }
        });

        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.textContent = '→';
        nextBtn.disabled = gridCurrentPage >= totalPages;
        nextBtn.setAttribute('aria-label', 'Next page');
        nextBtn.addEventListener('click', function () {
            if (gridCurrentPage < totalPages) {
                gridCurrentPage++;
                renderGridPage();
                scrollToGrid();
                updateBreadcrumb('grid');
            }
        });
        nav.appendChild(nextBtn);

        return nav;
    }

    function scrollToGrid() {
        const el = document.getElementById('grid-view');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function getPageButtons(current, total) {
        if (total <= 7) {
            return Array.from({ length: total }, function (_, i) { return i + 1; });
        }
        const pages = new Set([1, total, current]);
        if (current > 1)         pages.add(current - 1);
        if (current < total)     pages.add(current + 1);
        if (current > 2)         pages.add(current - 2);
        if (current < total - 1) pages.add(current + 2);

        const sorted = Array.from(pages).sort(function (a, b) { return a - b; });
        const result = [];
        for (let i = 0; i < sorted.length; i++) {
            if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
            result.push(sorted[i]);
        }
        return result;
    }

    // ---- Calendar state ----
    let allYears, dateMap;

    // ---- Shared dropdown builder ----
    function buildDropdown(items, currentValue, onSelect) {
        const picker = document.createElement('div');
        picker.className = 'calendar-year-picker';

        const btn = document.createElement('button');
        btn.className = 'calendar-year-btn calendar-year-dropdown-btn';
        btn.setAttribute('aria-haspopup', 'listbox');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = currentValue.label;

        const list = document.createElement('div');
        list.className = 'year-dropdown';
        list.setAttribute('role', 'listbox');
        list.hidden = true;

        items.forEach(function (item) {
            const opt = document.createElement('button');
            opt.className = 'year-option' + (item.value === currentValue.value ? ' active' : '');
            opt.setAttribute('role', 'option');
            opt.setAttribute('aria-selected', String(item.value === currentValue.value));
            opt.textContent = item.label;
            opt.addEventListener('click', function (e) {
                e.stopPropagation();
                closeList();
                onSelect(item.value);
            });
            list.appendChild(opt);
        });

        let open = false;

        function closeList() {
            if (!open) return;
            list.hidden = true;
            btn.setAttribute('aria-expanded', 'false');
            open = false;
            document.removeEventListener('click', onOutside, true);
        }

        function onOutside(e) {
            if (!picker.contains(e.target)) closeList();
        }

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (open) {
                closeList();
            } else {
                list.hidden = false;
                btn.setAttribute('aria-expanded', 'true');
                open = true;
                setTimeout(function () {
                    document.addEventListener('click', onOutside, true);
                }, 0);
            }
        });

        picker.appendChild(btn);
        picker.appendChild(list);
        return { el: picker, close: closeList };
    }

    // ---- Breadcrumb + URL ----
    function updateBreadcrumb(view, year, month, day) {
        const bc = document.getElementById('photo-breadcrumb');
        if (!bc) return;

        // "Calendar" always points to the most recent year's view
        const maxYear      = allYears.length ? Math.max.apply(null, allYears) : new Date().getFullYear();
        const calLandingUrl = '/photos/?view=calendar&year=' + maxYear;

        const home    = '<a href="/">Home</a>';
        const photos  = '<a href="/photos/">Photos</a>';
        const grid    = '<a href="/photos/">Grid</a>';           // intentionally same as Photos
        const calLink = '<a href="' + calLandingUrl + '">Calendar</a>';

        if (view === 'grid') {
            if (gridCurrentPage > 1) {
                const pageUrl = '/photos/?page=' + gridCurrentPage;
                bc.innerHTML = home + ' / ' + photos + ' / ' + grid +
                               ' / <a href="' + pageUrl + '">Page ' + gridCurrentPage + '</a>';
                history.replaceState(null, '', pageUrl);
            } else {
                bc.innerHTML = home + ' / ' + photos + ' / ' + grid;
                history.replaceState(null, '', '/photos/');
            }
        } else if (view === 'calendar' && !month) {
            const yearUrl = '/photos/?view=calendar&year=' + year;
            bc.innerHTML = home + ' / ' + photos + ' / ' + calLink +
                           ' / <a href="' + yearUrl + '">' + year + '</a>';
            history.replaceState(null, '', yearUrl);
        } else if (view === 'calendar' && month && !day) {
            const yearUrl  = '/photos/?view=calendar&year=' + year;
            const monthUrl = yearUrl + '&month=' + month;
            bc.innerHTML = home + ' / ' + photos + ' / ' + calLink +
                           ' / <a href="' + yearUrl + '">' + year + '</a>' +
                           ' / <a href="' + monthUrl + '">' + MONTHS[month - 1] + '</a>';
            history.replaceState(null, '', monthUrl);
        } else if (view === 'calendar' && month && day) {
            const yearUrl  = '/photos/?view=calendar&year=' + year;
            const monthUrl = yearUrl + '&month=' + month;
            const dayUrl   = monthUrl + '&day=' + day;
            bc.innerHTML = home + ' / ' + photos + ' / ' + calLink +
                           ' / <a href="' + yearUrl + '">' + year + '</a>' +
                           ' / <a href="' + monthUrl + '">' + MONTHS[month - 1] + '</a>' +
                           ' / <a href="' + dayUrl + '">' + day + '</a>';
            history.replaceState(null, '', dayUrl);
        }
    }

    // ---- Calendar: year view ----
    function renderCalendar(year, updateNav) {
        if (updateNav === undefined) updateNav = true;

        calendarState = { year, month: null, day: null };

        // Surprise me: random photo from this year
        surprisePhotos = Object.entries(dateMap)
            .filter(function (entry) { return entry[0].startsWith(year + '-'); })
            .reduce(function (acc, entry) { return acc.concat(entry[1]); }, []);
        if (!surprisePhotos.length) surprisePhotos = Object.values(dateMap).reduce(function (a, v) { return a.concat(v); }, []);

        const wrap = document.getElementById('calendar-view');
        wrap.innerHTML = '';

        const minYear = Math.min.apply(null, allYears);
        const maxYear = Math.max.apply(null, allYears);

        const hdr = document.createElement('div');
        hdr.className = 'photos-calendar-header';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'calendar-year-btn';
        prevBtn.textContent = '←';
        prevBtn.setAttribute('aria-label', 'Previous year');
        prevBtn.disabled = year <= minYear;
        prevBtn.addEventListener('click', function () { renderCalendar(year - 1); });

        const yearItems = allYears.slice().reverse().map(function (y) { return { label: String(y), value: y }; });
        const yearPicker = buildDropdown(yearItems, { label: String(year), value: year }, function (y) { renderCalendar(y); });

        const nextBtn = document.createElement('button');
        nextBtn.className = 'calendar-year-btn';
        nextBtn.textContent = '→';
        nextBtn.setAttribute('aria-label', 'Next year');
        nextBtn.disabled = year >= maxYear;
        nextBtn.addEventListener('click', function () { renderCalendar(year + 1); });

        hdr.appendChild(prevBtn);
        hdr.appendChild(yearPicker.el);
        hdr.appendChild(nextBtn);
        wrap.appendChild(hdr);

        const monthsGrid = document.createElement('div');
        monthsGrid.className = 'months-grid';

        for (let m = 1; m <= 12; m++) {
            const month = m;
            const block = document.createElement('div');
            block.className = 'month-block';

            const nameDom = document.createElement('div');
            nameDom.className = 'month-name month-name-clickable';
            nameDom.textContent = MONTHS[month - 1];
            nameDom.setAttribute('role', 'button');
            nameDom.setAttribute('tabindex', '0');
            nameDom.title = 'Expand ' + MONTHS[month - 1];
            nameDom.addEventListener('click', function () { expandMonth(year, month); });
            nameDom.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); expandMonth(year, month); }
            });
            block.appendChild(nameDom);

            const grid = document.createElement('div');
            grid.className = 'month-grid';

            DAY_HEADERS.forEach(function (h) {
                const cell = document.createElement('div');
                cell.className = 'day-header';
                cell.textContent = h;
                grid.appendChild(cell);
            });

            const firstDow    = new Date(year, month - 1, 1).getDay();
            const offset      = (firstDow + 6) % 7;
            const daysInMonth = new Date(year, month, 0).getDate();

            for (let i = 0; i < offset; i++) {
                const cell = document.createElement('div');
                cell.className = 'day-cell empty';
                grid.appendChild(cell);
            }

            for (let d = 1; d <= daysInMonth; d++) {
                const day       = d;
                const key       = year + '-' + pad2(month) + '-' + pad2(day);
                const dayPhotos = dateMap[key] || [];

                const cell = document.createElement('div');
                cell.className = 'day-cell';

                const num = document.createElement('span');
                num.textContent = day;
                cell.appendChild(num);

                if (dayPhotos.length > 0) {
                    cell.classList.add('has-photos');
                    cell.setAttribute('role', 'button');
                    cell.setAttribute('tabindex', '0');
                    cell.title = dayPhotos.length + ' photo' + (dayPhotos.length > 1 ? 's' : '');

                    if (dayPhotos.length > 1) {
                        const cnt = document.createElement('span');
                        cnt.className = 'day-count';
                        cnt.textContent = dayPhotos.length;
                        cell.appendChild(cnt);
                    }

                    const photos = dayPhotos.slice();
                    cell.addEventListener('click', function (e) { e.stopPropagation(); openLb(photos, 0); });
                    cell.addEventListener('keydown', function (e) {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(photos, 0); }
                    });
                }

                grid.appendChild(cell);
            }

            block.appendChild(grid);
            monthsGrid.appendChild(block);
        }

        wrap.appendChild(monthsGrid);

        // Year stats line
        const yearPhotos = allPhotos.filter(function (f) { return f.startsWith(String(year)); });
        if (yearPhotos.length) {
            const topMonth   = mostActive(yearPhotos, function (f) { return f.slice(4, 6); });
            const monthName  = MONTHS[parseInt(topMonth) - 1];
            const isComplete = year < new Date().getFullYear();
            const prep       = isComplete ? 'from' : 'in';
            const count      = yearPhotos.length;
            wrap.appendChild(makeStatsEl(
                count + ' photo' + (count !== 1 ? 's' : '') + ' ' + prep + ' ' + year +
                ' · most active month: ' + monthName
            ));
        }

        if (updateNav) updateBreadcrumb('calendar', year, null, null);
    }

    // ---- Calendar: expanded month view ----
    function expandMonth(year, month) {
        calendarState = { year, month, day: null };

        // Surprise me: random photo from this month
        const monthPrefix = year + '-' + pad2(month);
        surprisePhotos = Object.entries(dateMap)
            .filter(function (entry) { return entry[0].startsWith(monthPrefix); })
            .reduce(function (acc, entry) { return acc.concat(entry[1]); }, []);
        if (!surprisePhotos.length) {
            surprisePhotos = Object.entries(dateMap)
                .filter(function (entry) { return entry[0].startsWith(year + '-'); })
                .reduce(function (acc, entry) { return acc.concat(entry[1]); }, []);
        }

        const wrap = document.getElementById('calendar-view');
        wrap.innerHTML = '';

        // Header: back + month picker + year picker
        const hdr = document.createElement('div');
        hdr.className = 'expanded-month-header';

        const backBtn = document.createElement('button');
        backBtn.className = 'calendar-back-btn';
        backBtn.textContent = '← Back';
        backBtn.addEventListener('click', function () { renderCalendar(year); });

        // Month picker: only months with photos in this year (fallback: all 12)
        const photoMonths = [];
        for (let m = 1; m <= 12; m++) {
            const hasPhoto = Object.keys(dateMap).some(function (k) {
                const parts = k.split('-');
                return +parts[0] === year && +parts[1] === m;
            });
            if (hasPhoto) photoMonths.push(m);
        }
        const monthList  = photoMonths.length ? photoMonths : Array.from({ length: 12 }, function (_, i) { return i + 1; });
        const monthItems = monthList.map(function (m) { return { label: MONTHS[m - 1], value: m }; });
        const monthPicker = buildDropdown(monthItems, { label: MONTHS[month - 1], value: month }, function (m) { expandMonth(year, m); });

        const yearItems  = allYears.slice().reverse().map(function (y) { return { label: String(y), value: y }; });
        const yearPicker = buildDropdown(yearItems, { label: String(year), value: year }, function (y) { expandMonth(y, month); });

        hdr.appendChild(backBtn);
        hdr.appendChild(monthPicker.el);
        hdr.appendChild(yearPicker.el);
        wrap.appendChild(hdr);

        // Calendar table
        const calTable = document.createElement('div');
        calTable.className = 'expanded-month-calendar';

        const headerRow = document.createElement('div');
        headerRow.className = 'expanded-day-header-row';
        DAY_HEADERS_FULL.forEach(function (h) {
            const cell = document.createElement('div');
            cell.className = 'expanded-day-header';
            cell.textContent = h;
            headerRow.appendChild(cell);
        });
        calTable.appendChild(headerRow);

        const grid = document.createElement('div');
        grid.className = 'expanded-month-grid';

        const firstDow    = new Date(year, month - 1, 1).getDay();
        const offset      = (firstDow + 6) % 7;
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let i = 0; i < offset; i++) {
            const cell = document.createElement('div');
            cell.className = 'expanded-day-cell empty';
            grid.appendChild(cell);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const day       = d;
            const key       = year + '-' + pad2(month) + '-' + pad2(day);
            const dayPhotos = dateMap[key] || [];

            const cell = document.createElement('div');
            cell.className = 'expanded-day-cell';

            if (dayPhotos.length > 0) {
                cell.classList.add('has-photos');

                // Multi-photo grid: 1 full / 2 split / 3 asymmetric / 4+ 2×2
                const tileCount  = Math.min(dayPhotos.length, 4);
                const gridClass  = 'tile-' + tileCount;
                const photoGrid  = document.createElement('div');
                photoGrid.className = 'day-photo-grid ' + gridClass;

                dayPhotos.slice(0, 4).forEach(function (f, idx) {
                    const tile = document.createElement('div');
                    tile.className = 'day-photo-tile';

                    const img = document.createElement('img');
                    img.src = PHOTO_BASE + f;
                    img.alt = '';
                    img.loading = 'lazy';
                    img.addEventListener('error', function () { img.style.display = 'none'; });
                    tile.appendChild(img);

                    // Last tile when overflow: show "+N" overlay
                    if (idx === 3 && dayPhotos.length > 4) {
                        const more = document.createElement('span');
                        more.className = 'day-photo-more';
                        more.textContent = '+' + (dayPhotos.length - 3);
                        tile.appendChild(more);
                    }

                    photoGrid.appendChild(tile);
                });

                cell.appendChild(photoGrid);

                const photos = dayPhotos.slice();

                // Clicking anywhere on the cell (including when img is missing) → lightbox.
                // dayNum's stopPropagation handles the day-view case separately.
                cell.setAttribute('role', 'button');
                cell.setAttribute('tabindex', '0');
                cell.title = 'Click photo to open · Click date number to view day grid';
                cell.addEventListener('click', function () { openLb(photos, 0); });
                cell.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(photos, 0); }
                });
            }

            // Clicking the day number → day view (separate from photo click)
            const dayNum = document.createElement('span');
            dayNum.className = 'expanded-day-num';
            dayNum.textContent = day;
            if (dayPhotos.length > 0) {
                const daySnap = day;
                dayNum.classList.add('has-link');
                dayNum.setAttribute('role', 'button');
                dayNum.setAttribute('tabindex', '0');
                dayNum.setAttribute('aria-label', 'View all photos from ' + MONTHS[month - 1] + ' ' + day + ' as grid');
                dayNum.addEventListener('click', function (e) {
                    e.stopPropagation();
                    expandDay(year, month, daySnap);
                });
                dayNum.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault(); e.stopPropagation();
                        expandDay(year, month, daySnap);
                    }
                });
            }
            cell.appendChild(dayNum);

            grid.appendChild(cell);
        }

        // End-padding to complete the last row (prevents double border at bottom)
        const total     = offset + daysInMonth;
        const remainder = total % 7;
        if (remainder !== 0) {
            for (let i = 0; i < 7 - remainder; i++) {
                const cell = document.createElement('div');
                cell.className = 'expanded-day-cell empty';
                grid.appendChild(cell);
            }
        }

        calTable.appendChild(grid);
        wrap.appendChild(calTable);

        // Month stats line — "most active day" = day of the week with the most photos
        const prefix      = String(year) + pad2(month);
        const monthPhotos = allPhotos.filter(function (f) { return f.startsWith(prefix); });
        if (monthPhotos.length) {
            const DAYS_OF_WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            const topDayName = mostActive(monthPhotos, function (f) {
                const d = new Date(parseInt(f.slice(0,4)), parseInt(f.slice(4,6)) - 1, parseInt(f.slice(6,8)));
                return DAYS_OF_WEEK[d.getDay()];
            });
            const count = monthPhotos.length;
            wrap.appendChild(makeStatsEl(
                count + ' photo' + (count !== 1 ? 's' : '') + ' in ' +
                MONTHS[month - 1] + ' ' + year +
                ' · most active day: ' + topDayName
            ));
        }

        updateBreadcrumb('calendar', year, month, null);

        // ESC → year view
        function escHandler(e) {
            if (e.key === 'Escape' && !lb.el.classList.contains('active')) {
                renderCalendar(year);
                document.removeEventListener('keydown', escHandler);
            }
        }
        document.addEventListener('keydown', escHandler);

        // Swipe left/right to move between months (mobile)
        const minYear = Math.min.apply(null, allYears);
        const maxYear = Math.max.apply(null, allYears);
        let swipeStartX = 0;
        let swipeStartY = 0;

        wrap.addEventListener('touchstart', function (e) {
            swipeStartX = e.changedTouches[0].screenX;
            swipeStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        wrap.addEventListener('touchend', function (e) {
            if (lb.el.classList.contains('active')) return;
            const dx = e.changedTouches[0].screenX - swipeStartX;
            const dy = e.changedTouches[0].screenY - swipeStartY;
            if (Math.abs(dx) < 50) return;
            if (Math.abs(dy) / Math.abs(dx) > 0.6) return; // too vertical
            if (dx < 0) {
                // Swipe left → next month
                if (month < 12) expandMonth(year, month + 1);
                else if (year < maxYear) expandMonth(year + 1, 1);
            } else {
                // Swipe right → prev month
                if (month > 1) expandMonth(year, month - 1);
                else if (year > minYear) expandMonth(year - 1, 12);
            }
        }, { passive: true });
    }

    // ---- Calendar: day view ----
    function expandDay(year, month, day) {
        const key       = year + '-' + pad2(month) + '-' + pad2(day);
        const dayPhotos = dateMap[key] || [];
        if (!dayPhotos.length) return;

        calendarState = { year, month, day };

        // Surprise me: only this day's photos
        surprisePhotos = dayPhotos.slice();

        const wrap = document.getElementById('calendar-view');
        wrap.innerHTML = '';

        // Header
        const hdr = document.createElement('div');
        hdr.className = 'expanded-month-header';

        const backBtn = document.createElement('button');
        backBtn.className = 'calendar-back-btn';
        backBtn.textContent = '← Back';
        backBtn.addEventListener('click', function () { expandMonth(year, month); });

        const title = document.createElement('span');
        title.className = 'expanded-month-title';
        title.textContent = MONTHS[month - 1] + ' ' + day + ', ' + year;

        hdr.appendChild(backBtn);
        hdr.appendChild(title);
        wrap.appendChild(hdr);

        // Photo grid (reuses grid + item styles from the main grid view)
        const grid = document.createElement('div');
        grid.className = 'photos-grid';

        dayPhotos.forEach(function (f, i) {
            const item = document.createElement('div');
            item.className = 'photo-item';

            const img = document.createElement('img');
            img.loading = 'lazy';
            img.src = PHOTO_BASE + f;
            img.alt = '';

            const d = parseFilename(f);
            img.addEventListener('error', function () {
                img.style.display = 'none';
                const ph = document.createElement('div');
                ph.className = 'photo-placeholder';
                ph.textContent = d ? formatTimestamp(d) : f;
                item.appendChild(ph);
            });

            item.appendChild(img);
            item.addEventListener('click', function () { openLb(dayPhotos, i); });
            grid.appendChild(item);
        });

        wrap.appendChild(grid);

        updateBreadcrumb('calendar', year, month, day);

        function escHandler(e) {
            if (e.key === 'Escape' && !lb.el.classList.contains('active')) {
                expandMonth(year, month);
                document.removeEventListener('keydown', escHandler);
            }
        }
        document.addEventListener('keydown', escHandler);
    }

    // ---- Init ----
    async function init() {
        try {
            const res = await fetch('/photos/photos.json');
            if (!res.ok) throw new Error('photos.json not found');
            const data = await res.json();
            const photos = data.photos;
            allPhotos   = photos;
            cameraData  = data.cameras || {};
            cameraCount = (data.stats && data.stats.camera_count) || 0;

            // Build reverse map for O(1) camera lookup in lightbox captions
            Object.entries(cameraData).forEach(function (entry) {
                entry[1].forEach(function (f) { fileToCamera[f] = entry[0]; });
            });

            dateMap  = groupByDate(photos);
            allYears = getYears(photos);

            buildLightbox();
            buildCameraFilter();

            // Render both views silently (no breadcrumb/URL update yet)
            renderGrid(photos);
            const defaultYear = allYears[allYears.length - 1] || new Date().getFullYear();
            renderCalendar(defaultYear, false);
            // renderCalendar sets surprisePhotos to the year's photos; reset for grid view
            surprisePhotos = gridAllPhotos.slice();

            const gridBtn  = document.querySelector('[data-view="grid"]');
            const calBtn   = document.querySelector('[data-view="calendar"]');
            const gridView = document.getElementById('grid-view');
            const calView  = document.getElementById('calendar-view');

            gridBtn.addEventListener('click', function () {
                gridView.hidden = false;
                calView.hidden  = true;
                gridBtn.classList.add('active');
                calBtn.classList.remove('active');
                setCameraFilterVisible(true);
                surprisePhotos = gridAllPhotos.slice();
                updateBreadcrumb('grid');
            });

            calBtn.addEventListener('click', function () {
                calView.hidden  = false;
                gridView.hidden = true;
                calBtn.classList.add('active');
                gridBtn.classList.remove('active');
                setCameraFilterVisible(false);
                const s = calendarState;
                if (s.year) updateBreadcrumb('calendar', s.year, s.month, s.day);
            });

            // Context-aware Surprise me
            document.querySelector('.photos-surprise-btn').addEventListener('click', function () {
                const pool = surprisePhotos.length ? surprisePhotos : gridAllPhotos;
                openLb(pool, Math.floor(Math.random() * pool.length));
            });

            // Restore view from URL params
            const params      = new URLSearchParams(window.location.search);
            const viewParam   = params.get('view');
            const yearParam   = params.get('year');
            const monthParam  = params.get('month');
            const dayParam    = params.get('day');
            const pageParam   = params.get('page');

            if (viewParam === 'calendar') {
                const year  = yearParam  ? parseInt(yearParam,  10) : defaultYear;
                const month = monthParam ? parseInt(monthParam, 10) : null;
                const day   = dayParam   ? parseInt(dayParam,   10) : null;

                calView.hidden  = false;
                gridView.hidden = true;
                calBtn.classList.add('active');
                gridBtn.classList.remove('active');
                setCameraFilterVisible(false);

                if (day && month)  expandDay(year, month, day);
                else if (month)    expandMonth(year, month);
                else               renderCalendar(year);
            } else {
                // Restore grid page from URL if present
                if (pageParam) {
                    const p = parseInt(pageParam, 10);
                    const totalPages = Math.ceil(gridAllPhotos.length / GRID_PAGE_SIZE);
                    if (p > 1 && p <= totalPages) {
                        gridCurrentPage = p;
                        renderGridPage(); // re-render for the restored page
                    }
                }
                surprisePhotos = gridAllPhotos.slice();
                updateBreadcrumb('grid');
            }

        } catch (err) {
            console.error('Photos: failed to load photos.json:', err);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
