;(function () {
    var template = '<div class="datepicker--time">' +
        '<ul class="datepicker--time-current">' +
        '   <li>' +
        '     <div class="datepicker--time-current-hours">#{hourVisible}</div>' +
        '     <div class="datepicker--dropdown">' +
        '       <ul>#{hourDropdown}</ul>' +
        '     </div>' +
        '   </li>' +
        '   <div class="datepicker--time-current-colon">:</div>' +
        '   <li>' +
        '     <div class="datepicker--time-current-minutes">#{minValue}</div>' +
        '     <div class="datepicker--dropdown">' +
        '       <ul>#{minDropdown}</ul>' +
        '     </div>' +
        '   </li>' +
        '   <div class="datepicker--time-current-colon">:</div>' +
        '   <li>' +
        '     <div class="datepicker--time-current-seconds">#{secValue}</div>' +
        '     <div class="datepicker--dropdown">' +
        '       <ul>#{secDropdown}</ul>' +
        '     </div>' +
        '   </li>' +
        '</ul>' +
        '<div class="datepicker--time-sliders">' +
        '   <div class="datepicker--time-row">' +
        '      <input type="range" name="hours" value="#{hourValue}" min="#{hourMin}" max="#{hourMax}" step="#{hourStep}"/>' +
        '   </div>' +
        '   <div class="datepicker--time-row">' +
        '      <input type="range" name="minutes" value="#{minValue}" min="#{minMin}" max="#{minMax}" step="#{minStep}"/>' +
        '   </div>' +
        '   <div class="datepicker--time-row">' +
        '      <input type="range" name="seconds" value="#{secValue}" min="#{secMin}" max="#{secMax}" step="#{secStep}"/>' +
        '   </div>' +
        '</div>' +
        '</div>',
        datepicker = $.fn.datepicker,
        dp = datepicker.Constructor;

    datepicker.Timepicker = function (inst, opts) {
        this.d = inst;
        this.opts = opts;

        this.init();
    };

    datepicker.Timepicker.prototype = {
        init: function () {
            var input = 'input';
            this._setTime(this.d.date);
            this._buildHTML();

            if (navigator.userAgent.match(/trident/gi)) {
                input = 'change';
            }

            this.d.$el.on('selectDate', this._onSelectDate.bind(this));
            this.$ranges.on(input, this._onChangeRange.bind(this));
            this.$ranges.on('mouseup', this._onMouseUpRange.bind(this));
            this.$ranges.on('mousemove focus ', this._onMouseEnterRange.bind(this));
            this.$ranges.on('mouseout blur', this._onMouseOutRange.bind(this));

            var timepicker = this;

            // Show/hide the dropdowns and highlight selected values
            $("ul.datepicker--time-current > li", this.$timepicker).hover(function(){
                $('> div:first', this).addClass("-focus-");
                $('div.datepicker--dropdown', this).css('display', 'block');
                $('.datepicker--dropdown li[data-type="all"][data-hours=' + timepicker.hours + '][data-minutes=' + timepicker.minutes + '][data-seconds=' + timepicker.seconds + ']', this).addClass('datepicker--dropdown-selected');
                $('.datepicker--dropdown li[data-type="hours"][data-hours=' + timepicker.hours + ']', this).addClass('datepicker--dropdown-selected');
                $('.datepicker--dropdown li[data-type="minutes"][data-minutes=' + timepicker.minutes + ']', this).addClass('datepicker--dropdown-selected');
                $('.datepicker--dropdown li[data-type="seconds"][data-seconds=' + timepicker.seconds + ']', this).addClass('datepicker--dropdown-selected');
            }, function(){
                $('> div:first',this).removeClass("-focus-");
                $('div.datepicker--dropdown', this).css('display', 'none');
                $('.datepicker--dropdown li', this).removeClass('datepicker--dropdown-selected');
            });

            // Position submenus. See https://css-tricks.com/popping-hidden-overflow/
            $('div.datepicker--dropdown > ul > li', this.$timepicker).mouseenter(function() {
                var $menuItem = $(this);
                var $submenuWrapper = $('> div.datepicker--dropdown-submenu', $menuItem);
                // grab the menu item's position relative to its positioned parent
                var menuItemPos = $menuItem.position();
                // place the submenu in the correct position relevant to the menu item
                $submenuWrapper.css({
                    top: menuItemPos.top,
                    left: menuItemPos.left + $menuItem.outerWidth()
                });
            });

            // Handle mouse click
            $('div.datepicker--dropdown li', this.$timepicker).click(function() {
                if (this.dataset.hours !== undefined) {
                    timepicker.hours = this.dataset.hours;
                }
                if (this.dataset.minutes !== undefined) {
                    timepicker.minutes = this.dataset.minutes;
                }
                if (this.dataset.seconds !== undefined) {
                    timepicker.seconds = this.dataset.seconds;
                }
                $(this).parents('ul.datepicker--time-current div.datepicker--dropdown').css('display', 'none');
                timepicker.d.update();
                return false;
            });
        },

        _setTime: function (date) {
            var _date = dp.getParsedDate(date);

            this._handleDate(date);
            this.hours = _date.hours < this.minHours ? this.minHours : _date.hours;
            this.minutes = _date.minutes < this.minMinutes ? this.minMinutes : _date.minutes;
            this.seconds = _date.seconds < this.minSeconds ? this.minSeconds : _date.seconds;
        },

        /**
         * Sets minHours and minMinutes from date (usually it's a minDate)
         * Also changes minMinutes if current hours are bigger then @date hours
         * @param date {Date}
         * @private
         */
        _setMinTimeFromDate: function (date) {
            this.minHours = date.getHours();
            this.minMinutes = date.getMinutes();
            this.minSeconds = date.getSeconds();

            // If, for example, min hours are 10, and current hours are 12,
            // update minMinutes to default value, to be able to choose whole range of values
            if (this.d.lastSelectedDate) {
                if (this.d.lastSelectedDate.getHours() > date.getHours()) {
                    this.minMinutes = this.opts.minMinutes;
                }
            }
        },

        _setMaxTimeFromDate: function (date) {
            this.maxHours = date.getHours();
            this.maxMinutes = date.getMinutes();
            this.maxSeconds = date.getSeconds();

            if (this.d.lastSelectedDate) {
                if (this.d.lastSelectedDate.getHours() < date.getHours()) {
                    this.maxMinutes = this.opts.maxMinutes;
                }
            }
        },

        _setDefaultMinMaxTime: function () {
            var maxHours = 23,
                maxMinutes = 59,
                maxSeconds = 59,
                opts = this.opts;

            this.minHours = opts.minHours < 0 || opts.minHours > maxHours ? 0 : opts.minHours;
            this.minMinutes = opts.minMinutes < 0 || opts.minMinutes > maxMinutes ? 0 : opts.minMinutes;
            this.maxHours = opts.maxHours < 0 || opts.maxHours > maxHours ? maxHours : opts.maxHours;
            this.maxMinutes = opts.maxMinutes < 0 || opts.maxMinutes > maxMinutes ? maxMinutes : opts.maxMinutes;
            this.minSeconds = opts.minSeconds < 0 || opts.minSeconds > maxSeconds ? 0 : opts.minSeconds;
            this.maxSeconds = opts.maxSeconds < 0 || opts.maxSeconds > maxSeconds ? maxSeconds : opts.maxSeconds;
        },

        /**
         * Looks for min/max hours/minutes and if current values
         * are out of range sets valid values.
         * @private
         */
        _validateHoursMinutes: function (date) {
            if (this.hours < this.minHours) {
                this.hours = this.minHours;
            } else if (this.hours > this.maxHours) {
                this.hours = this.maxHours;
            }

            if (this.minutes < this.minMinutes) {
                this.minutes = this.minMinutes;
            } else if (this.minutes > this.maxMinutes) {
                this.minutes = this.maxMinutes;
            }

            if (this.seconds < this.minSeconds) {
                this.seconds = this.minSeconds;
            } else if (this.seconds > this.maxSeconds) {
                this.seconds = this.maxSeconds;
            }
        },

        _generateHoursDropown: function() {
            var dropdown = '';
            const minutesStep = 15;
            const minutesMinStep = Math.ceil(this.minMinutes / minutesStep) * minutesStep;
            const minutesMaxStep = Math.floor(this.maxMinutes / minutesStep) * minutesStep;
            const minSecondsPretty = this.minSeconds < 10 ? '0' + this.minSeconds : this.minSeconds;
            for (var hours = this.minHours; hours <= this.maxHours; hours++) {
                var hoursPretty = hours;
                var dayPeriod = '';
                if (this.d.ampm) {
                    if (hours == 0) {
                        hoursPretty = 12;
                    } else if (hours > 12) {
                        hoursPretty -= 12;
                    }
                    dayPeriod = '<span class="datepicker--time-current-ampm">' + (hours < 12 ? 'am' : 'pm') + '</span>';
                }
                if (hoursPretty < 10) {
                    hoursPretty = '0' + hoursPretty;
                }
                dropdown += '<li data-type="hours" data-hours="' + hours + '">' + hoursPretty + dayPeriod;
                if (minutesMinStep < minutesMaxStep) {
                    dropdown += ' &nbsp;&rsaquo;<div class="datepicker--dropdown-submenu"><ul>';
                    for (var minutes = minutesMinStep; minutes <= minutesMaxStep; minutes += minutesStep) {
                        dropdown += '<li data-type="all" data-hours="' + hours + '" data-minutes="' + minutes + '" data-seconds="' + this.minSeconds + '">' + hoursPretty + ':' + (minutes < 10 ? '0' + minutes : minutes) + ':' + minSecondsPretty + dayPeriod + '</li>';
                    }
                    dropdown += '</ul></div>';
                }
                dropdown += '</li>';
            }
            return dropdown;
        },

        _generateMinutesDropown: function() {
            return this._generateMinutesAndSecondsDropown(this.minMinutes, this.maxMinutes, 'minutes');
        },

        _generateSecondsDropown: function() {
            return this._generateMinutesAndSecondsDropown(this.minSeconds, this.maxSeconds, 'seconds');
        },

        _generateMinutesAndSecondsDropown: function(min, max, kind) {
            const step = 5;
            var dropdown = '';
            for (var bigstep = min; bigstep <= max; bigstep = Math.floor(bigstep / step) * step + step) {
                dropdown +=
                    '<li data-type="' + kind + '" data-' + kind + '="' + bigstep + '">' + (bigstep<10 ? '0' + bigstep : bigstep) + ' &nbsp;&rsaquo;' +
                    '  <div class="datepicker--dropdown-submenu">' +
                    '    <ul>';
                for (var singlestep = bigstep + 1; singlestep < Math.floor(bigstep / step) * step + step && singlestep <= max; singlestep++) {
                    dropdown += '<li data-type="' + kind + '" data-' + kind + '="' + singlestep + '">' + (singlestep<10 ? '0' + singlestep : singlestep) + '</li>';
                }
                dropdown +=
                    '    </ul>' +
                    '  </div>' +
                    '</li>';
            }
            return dropdown;
        },

        _buildHTML: function () {
            var lz = dp.getLeadingZeroNum,
                data = {
                    hourMin: this.minHours,
                    hourMax: lz(this.maxHours),
                    hourStep: this.opts.hoursStep,
                    hourValue: this.hours,
                    hourVisible: lz(this.displayHours),
                    hourDropdown: this._generateHoursDropown(),
                    minMin: this.minMinutes,
                    minMax: lz(this.maxMinutes),
                    minStep: this.opts.minutesStep,
                    minValue: lz(this.minutes),
                    minDropdown: this._generateMinutesDropown(),
                    secMin: this.minSeconds,
                    secMax: lz(this.maxSeconds),
                    secStep: this.opts.secondsStep,
                    secValue: lz(this.seconds),
                    secDropdown: this._generateSecondsDropown(),
                },
                _template = dp.template(template, data);

            this.$timepicker = $(_template).appendTo(this.d.$datepicker);
            this.$ranges = $('[type="range"]', this.$timepicker);
            this.$hours = $('[name="hours"]', this.$timepicker);
            this.$minutes = $('[name="minutes"]', this.$timepicker);
            this.$seconds = $('[name="seconds"]', this.$timepicker);
            this.$hoursText = $('.datepicker--time-current-hours', this.$timepicker);
            this.$minutesText = $('.datepicker--time-current-minutes', this.$timepicker);
            this.$secondsText = $('.datepicker--time-current-seconds', this.$timepicker);

            if (this.d.ampm) {
                this.$ampm = $('<span class="datepicker--time-current-ampm">')
                    .appendTo($('.datepicker--time-current', this.$timepicker))
                    .html(this.dayPeriod);

                this.$timepicker.addClass('-am-pm-');
            }
        },

        _updateCurrentTime: function () {
            var h =  dp.getLeadingZeroNum(this.displayHours),
                m = dp.getLeadingZeroNum(this.minutes),
                s = dp.getLeadingZeroNum(this.seconds);

            this.$hoursText.html(h);
            this.$minutesText.html(m);
            this.$secondsText.html(s);

            if (this.d.ampm) {
                this.$ampm.html(this.dayPeriod);
            }
        },

        _updateRanges: function () {
            this.$hours.attr({
                min: this.minHours,
                max: this.maxHours
            }).val(this.hours);

            this.$minutes.attr({
                min: this.minMinutes,
                max: this.maxMinutes
            }).val(this.minutes);
            
            this.$seconds.attr({
                min: this.minSeconds,
                max: this.maxSeconds
            }).val(this.seconds);
        },

        /**
         * Sets minHours, minMinutes etc. from date. If date is not passed, than sets
         * values from options
         * @param [date] {object} - Date object, to get values from
         * @private
         */
        _handleDate: function (date) {
            this._setDefaultMinMaxTime();
            if (date) {
                if (dp.isSame(date, this.d.opts.minDate)) {
                    this._setMinTimeFromDate(this.d.opts.minDate);
                } else if (dp.isSame(date, this.d.opts.maxDate)) {
                    this._setMaxTimeFromDate(this.d.opts.maxDate);
                }
            }

            this._validateHoursMinutes(date);
        },

        update: function () {
            this._updateRanges();
            this._updateCurrentTime();
        },

        /**
         * Calculates valid hour value to display in text input and datepicker's body.
         * @param date {Date|Number} - date or hours
         * @param [ampm] {Boolean} - 12 hours mode
         * @returns {{hours: *, dayPeriod: string}}
         * @private
         */
        _getValidHoursFromDate: function (date, ampm) {
            var d = date,
                hours = date;

            if (date instanceof Date) {
                d = dp.getParsedDate(date);
                hours = d.hours;
            }

            var _ampm = ampm || this.d.ampm,
                dayPeriod = 'am';

            if (_ampm) {
                switch(true) {
                    case hours == 0:
                        hours = 12;
                        break;
                    case hours == 12:
                        dayPeriod = 'pm';
                        break;
                    case hours > 11:
                        hours = hours - 12;
                        dayPeriod = 'pm';
                        break;
                    default:
                        break;
                }
            }

            return {
                hours: hours,
                dayPeriod: dayPeriod
            }
        },

        set hours (val) {
            this._hours = val;

            var displayHours = this._getValidHoursFromDate(val);

            this.displayHours = displayHours.hours;
            this.dayPeriod = displayHours.dayPeriod;
        },

        get hours() {
            return this._hours;
        },

        //  Events
        // -------------------------------------------------

        _onChangeRange: function (e) {
            var $target = $(e.target),
                name = $target.attr('name');
            
            this.d.timepickerIsActive = true;

            this[name] = $target.val();
            this._updateCurrentTime();
            this.d._trigger('timeChange', [this.hours, this.minutes, this.seconds]);

            this._handleDate(this.d.lastSelectedDate);
            this.update()
        },

        _onSelectDate: function (e, data) {
            this._handleDate(data);
            this.update();
        },

        _onMouseEnterRange: function (e) {
            var name = $(e.target).attr('name');
            $('.datepicker--time-current-' + name, this.$timepicker).addClass('-focus-');
        },

        _onMouseOutRange: function (e) {
            var name = $(e.target).attr('name');
            if (this.d.inFocus) return; // Prevent removing focus when mouse out of range slider
            $('.datepicker--time-current-' + name, this.$timepicker).removeClass('-focus-');
        },

        _onMouseUpRange: function (e) {
            this.d.timepickerIsActive = false;
        }
    };
})();
