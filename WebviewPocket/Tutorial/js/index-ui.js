(function() {
 /**
 * Creates a DOM element with specified attributes, styles, and event listeners.
 * @param {string} tag - The HTML tag name.
 * @param {Object} options - Configuration for class, content, events, styles, and attributes.
 * @returns {HTMLElement} The created DOM element.
 */
function createElement(tag, { className, textContent, innerHTML, events = {}, style = {}, ...attributes }) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (innerHTML !== undefined) {
        element.innerHTML = innerHTML;
    } else if (textContent !== undefined) {
        element.textContent = textContent;
    }

    Object.entries(attributes).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            element.setAttribute(key, value);
        }
    });

    Object.entries(events).forEach(([event, handler]) => {
        if (typeof handler === 'function') {
            element.addEventListener(event, handler);
        }
    });

    Object.entries(style).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            element.style[key] = value;
        }
    });

    return element;
}

/**
 * Tutorial class for managing an interactive tutorial UI.
 */
class Tutorial {
    // Private properties (unchanged)
    #container = null;
    #course = {};
    #actions = [];
    #steps = [];
    #resolution = null;
    #heightTopLayout = null;
    #type = null;
    #animal_icons = [];
    #decor_icons = [];
    #padding_bottom = false;
    #hasValidFirstAction = false;

    // Constants (unchanged)
    #footprintDirectionsMap = {
        7: ['right', 'right', 'left', 'left', 'right', 'right'],
        6: ['right', 'left', 'left', 'right', 'right'],
        5: ['right', 'left', 'right', 'right'],
        4: ['right', 'left', 'right'],
        3: ['right', 'left'],
        2: ['right']
    };
    #numberWords = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
    #randomAnimalImages = ['1.png', '3.png', '5.png'];

    // =========================================================================
    // PUBLIC METHODS
    // =========================================================================

    /**
     * Initializes the tutorial with provided data.
     * @param {Object|string} dataInit - Initial data or JSON string.
     * @throws {Error} If data is invalid or parsing fails.
     */
    init(dataInit) {
        try {
            const parsedData = typeof dataInit === 'string' ? JSON.parse(dataInit) : dataInit;
            this.#validateParsedData(parsedData);
            
            const { data, resolution, height_top_layout, type, padding_bottom } = parsedData;
            this.#setInitialProperties(resolution, height_top_layout, type, padding_bottom, data);
            
            const courseChanged = this.#extractCourseData(data);
            const actions = this.#prepareActions(data);
            console.log('Prepared Actions:', actions);
            const actionChanged = this.#cloneActions(actions);
            
            this.#autoMarkPreviousFinished();
            
            this.#updateSteps();
            if (!this.#container) {
                this.#createContainer();
            } else {
                this.#resetContainer();
            }
            this.#initializeUI();
            
           
        } catch (error) {
            throw new Error(`Initialization failed: ${error.message}`);
        }
    }

    /**
     * Sends a postMessage to the parent context.
     * @param {string} type - Message type.
     * @param {Object} data - Message data.
     */
    postMessage(type, data) {
        if (typeof type !== 'string' || !type.trim()) {
            console.error('Message type must be a non-empty string');
            return;
        }

        try {
            const message = JSON.stringify(data);
            if ('webkit' in window && window.webkit.messageHandlers[type]) {
                window.webkit.messageHandlers[type].postMessage(message);
            } else if ('android' in window && (window.android || window.Android)[type]) {
                (window.android || window.Android)[type](message);
            } else {
                console.warn(`No valid message handler found for type: ${type}`);
            }
        } catch (error) {
            console.error(`Failed to send message of type "${type}":`, error);
        }
    }

    // =========================================================================
    // PRIVATE INITIALIZATION METHODS
    // =========================================================================

    #validateParsedData(parsedData) {
        if (!parsedData || typeof parsedData !== 'object') {
            throw new Error('dataInit must be a valid object or JSON string');
        }
        this.#validateInitData(parsedData.data);
    }

    #setInitialProperties(resolution, height_top_layout, type, padding_bottom, data) {
        this.#resolution = resolution ?? null;
        this.#heightTopLayout = height_top_layout ?? null;
        this.#type = type;
        this.#padding_bottom = padding_bottom ?? false;
        this.#animal_icons = data?.animal_icons ?? [];
        this.#decor_icons = data?.decor_icons ?? [];
    }

    #validateInitData(data) {
        if (!data?.actions?.length) {
            throw new Error('Invalid or missing actions data');
        }
    }

    // =========================================================================
    // PRIVATE ACTION PROCESSING METHODS
    // =========================================================================

    #prepareActions(data) {
        let actions = data.actions || [];
        this.#hasValidFirstAction = this.#isValidAction(data.first_action);
        
        if (this.#hasValidFirstAction) {
            return this.#prepareActionsWithFirstAction(actions, data.first_action);
        } else {
            return this.#prepareActionsWithoutFirstAction(actions);
        }
    }

    #prepareActionsWithFirstAction(actions, firstAction) {
        const firstActionEnhanced = {
            ...firstAction,
            internalId: `${firstAction.id}_first`,
            order: 0,
            tasks: [],
            icon: firstAction.icon || null,
            sub_title: firstAction.sub_title || null,
            bg_color: firstAction.bg_color || '#ffffff',
            finished: firstAction.finished ?? false,
            is_first_action: true
        };
        return [firstActionEnhanced, ...actions.map(action => ({
            ...action,
            order: action.order + 1,
            internalId: action.id,
            is_first_action: false
        }))];
    }

    #prepareActionsWithoutFirstAction(actions) {
        return [
            {
                id: 'dummy_start',
                internalId: 'dummy_start',
                title: '',
                order: 0,
                tasks: [],
                finished: true,
                is_first_action: false,
                bg_color: '#ffffff',
                is_dummy: true
            },
            ...actions.map(action => ({
                ...action,
                order: action.order + 1,
                internalId: action.id,
                is_first_action: false
            }))
        ];
    }

    #extractCourseData({ id, bg_color, illustration, illus_assets }) {
        const newCourse = { id, bg_color, illustration, illus_assets };
        const changed = (
            this.#course.id !== id ||
            this.#course.bg_color !== bg_color ||
            this.#course.illustration !== illustration ||
            this.#course.illus_assets !== illus_assets
        );
        this.#course = newCourse;
        return changed;
    }

    #cloneActions(actions) {
        const newActions = structuredClone(actions).sort((a, b) => a.order - b.order);
        const { changed, changedActionIds, orderChanged } = this.#compareActions(newActions);
        
        this.#actions = newActions;
        return { changed, changedActionIds, orderChanged };
    }

    #compareActions(newActions) {
        const changedActionIds = new Set();
        let changed = false;
        let orderChanged = false;

        if (this.#actions.length !== newActions.length) {
            changed = true;
            orderChanged = true;
            newActions.forEach(a => changedActionIds.add(a.id));
        } else {
            newActions.forEach((newAction, i) => {
                const oldAction = this.#actions[i];
                if (!oldAction || JSON.stringify(oldAction) !== JSON.stringify(newAction)) {
                    changed = true;
                    changedActionIds.add(newAction.id);
                    if (oldAction?.id !== newAction.id) {
                        orderChanged = true;
                    }
                }
            });
        }

        return { changed, changedActionIds, orderChanged };
    }

    // =========================================================================
    // PRIVATE STEP PROCESSING METHODS
    // =========================================================================

    #updateSteps() {
        const footprintDirections = this.#getFootprintDirections();
        const nextActionIndex = this.#nextUnfinishedIndex();
        this.#steps = this.#actions.map((action, index) =>
            this.#createStep(action, index, footprintDirections, nextActionIndex)
        );
    }

    #createStep(action, index, footprintDirections, nextActionIndex) {
        const isFirst = index === 0;
        const isLast = index === this.#actions.length - 1;
        const isCompleted = action.finished ?? false;
        const isDummy = action.is_dummy;

        
        const animalImage = this.#getAnimalImage(action, index, isDummy);
      
        return {
            className: this.#getStepClassName(isFirst, isLast, isCompleted, isDummy),
            action: {
                icon: action.icon,
                title: action.title,
                sub_title: action.sub_title,
                bg_color: action.bg_color,
                bd_color: action.bd_color,
                animal: animalImage,
                animalVisible: index === nextActionIndex && !action.is_dummy,
                actionId: action.internalId,
                is_dummy: action.is_dummy || false
            },
            footer: this.#createFooter(isLast, isCompleted, index, footprintDirections),
            text: isFirst ? 'Start' : undefined,
            title: action.title,
            bg_color: action.bg_color,
            completed: isCompleted,
            isFirst,
            includeTask: !action.is_dummy
        };
    }

    #getAnimalImage(action, index, isDummy) {
         if (action.is_dummy) return '';
    
        const animalIcon = this.#animal_icons[index];
        if (animalIcon) {
            return `${this.#course.illus_assets}${this.#course.illustration}/animals/${animalIcon}`;
        }
        
        return `${this.#course.illus_assets}${this.#course.illustration}/animals/${index + 1}.png`;
    }

    #createFooter(isLast, isCompleted, index, footprintDirections) {
        if (isLast) {
            return {
                type: 'flag',
                src: isCompleted
                    ? `${this.#course.illus_assets}icon-default/icon-flag-finished.png`
                    : `${this.#course.illus_assets}icon-default/icon-flag.png`,
                text: 'GOAL'
            };
        }

        return {
            type: 'footprint',
            className: `tutorial-action-footprint--${this.#numberToWord(index + 1)}`,
            foot: {
                count: index === 0 ? 3 : 2,
                src: `${this.#course.illus_assets}${this.#course.illustration}/footprints/left_${isCompleted ? 'dark' : 'light'}.png`,
                direction: footprintDirections[index] || 'right'
            }
        };
    }

    #nextUnfinishedIndex() {
        const done = this.#actions.findLast(a => a.finished && !a.is_dummy);
        if (!done) return this.#actions.findIndex(a => !a.is_dummy);
        const next = this.#actions.find(a => !a.finished && a.order > done.order);
        return next ? this.#actions.indexOf(next) : this.#actions.length;
    }

    #autoMarkPreviousFinished() {
        const lastDone = this.#actions.findLast(a => a.finished && !a.is_dummy);
        if (!lastDone) return { updated: [] };
        
        const changed = [];
        for (const a of this.#actions) {
            if (a.order < lastDone.order && !a.finished && !a.is_dummy) {
                a.finished = true;
                changed.push(a.id);
            }
        }
        return { updated: changed };
    }

    // =========================================================================
    // PRIVATE UTILITY METHODS
    // =========================================================================

    #numberToWord(num) {
        return this.#numberWords[num - 1] || `step${num}`;
    }

    #getFootprintDirections() {
        return this.#footprintDirectionsMap[this.#actions.length] || [];
    }

    #getStepClassName(isFirst, isLast, isCompleted, isDummy) {
        return [
            'tutorial-action',
            isFirst && 'tutorial-action--first',
            isLast && 'tutorial-action--end',
            isCompleted && 'tutorial-action--done',
            isDummy && 'no-first-action',
            this.#hasValidFirstAction && 'tutorial-action-no-first'
        ].filter(Boolean).join(' ');
    }

    #isValidAction(action) {
        return action && typeof action === 'object' && action.id && action.title;
    }

    #isPreviousComplete(actionIndex) {
        return this.#actions.slice(0, actionIndex).every(action => action.finished || action.is_dummy);
    }

    #createContainer() {
        this.#applyPlatformStyles();
        this.#container = createElement('div', { className: 'tutorial' });
        document.body.appendChild(this.#container);
    }

    #applyPlatformStyles() {
        if (this.#type.toLowerCase() === 'ios' && this.#heightTopLayout && this.#resolution) {
            const heightTopLayout = this.#convertPhysicalPixelsToVh(
                this.#heightTopLayout, 
                this.#resolution, 
                window.devicePixelRatio || 3
            );
            document.body.style.setProperty('--height-top-layout', `${heightTopLayout}vh`);
        }
        
        document.body.classList.add(
            this.#type.toLowerCase() === 'ios' ? 'use-ios' : 'use-android'
        );
        document.body.style.setProperty('--bg-body', this.#course.bg_color || '#ffffff');
        document.body.style.setProperty('--pb-body', this.#padding_bottom ? '10px' : '0');
    }

    #resetContainer() {
        this.#container.innerHTML = '';
    }

    #initializeUI() {
        const wrapperInner = createElement('div', { className: 'tutorial-wrapper-inner' });
        const wrapper = createElement('div', { className: 'tutorial-wrapper' });

        this.#steps.forEach((step, index) => {
            const actionElement = this.#createActionElement(step, index);
            wrapper.appendChild(actionElement);
        });

        wrapperInner.append(wrapper);
        this.#container.appendChild(wrapperInner);
    }

    #createActionElement(step, index) {
        try {
            const action = createElement('div', { 
                className: step.className, 
                'data-total-action': this.#actions.length 
            });
            const actionWrapper = createElement('div', { className: 'tutorial-action-wrapper' });

            if (step.includeTask) {
                actionWrapper.appendChild(this.#createActionLabel(step.action, step.isFirst));
            }

            // const realIndex = this.#hasValidFirstAction ? index : index - 1;
            const decorIcon = index >= 0 && this.#decor_icons[index]
                ? `${this.#course.illus_assets}${this.#course.illustration}/items/${this.#decor_icons[index]}`
                : '';
             
            actionWrapper.appendChild(this.#createDecorElement(decorIcon));

            if (step.text) {
                actionWrapper.appendChild(createElement('div', {
                    className: 'tutorial-text',
                    textContent: step.text
                }));
            }
            
            action.append(actionWrapper, this.#createFootPrint(step, index));
            return action;
        } catch (error) {
            console.error(`Error creating action element for actionId: ${step.action.actionId}`, error);
            throw error;
        }
    }

    #createActionLabel(action, isFirst) {
        const actionItem = createElement('div', {
            className: `tutorial-task ${isFirst ? 'tutorial-task--first' : ''}`,
            events: { click: () => this.#evtHandleAction(action.actionId) },
        });
        actionItem.style.setProperty('--bg-action', action.bg_color ?? '#FFFFFF');
        actionItem.style.setProperty('--border-action', action.bd_color ?? '#FFFFFF');

        actionItem.append(
            this.#createAnimalElement(action.animal, action.animalVisible),
            this.#createCheckmarkElement(isFirst),
            this.#createTaskInnerElement(action.icon, action.title, action.sub_title)
        );
        return actionItem;
    }

    #createDecorElement(animalSrc) {
        const decorDiv = createElement('div', {
            className: 'tutorial-decor',
            'data-total-action': this.#actions.length,
        });
        decorDiv.appendChild(this.#createImage(animalSrc));
        return decorDiv;
    }


    #createAnimalElement(animalSrc, isVisible) {
        const animalDiv = createElement('div', {
            className: 'tutorial-animal',
            'data-total-action': this.#actions.length,
            style: { display: isVisible ? 'flex' : 'none' }
        });
        animalDiv.appendChild(this.#createImage(animalSrc));
        return animalDiv;
    }

    #createTaskInnerElement(icon, title, sub_title) {
        const inner = createElement('div', { className: 'tutorial-task-inner' });

        if (icon) {
            const iconDiv = createElement('div', { className: 'task-icon' });
            iconDiv.appendChild(this.#createImage(icon));
            inner.appendChild(iconDiv);
        }

        const taskContentDiv = createElement('div', { className: 'task-content' });
        taskContentDiv.append(
            createElement('small', { className: 'sub-title-action', innerHTML: sub_title ?? '' }),
            createElement('span', { className: 'title-action', innerHTML: title })
        );

        inner.appendChild(taskContentDiv);
        return inner;
    }

    #createCheckmarkElement(isFirst) {
        const checkmark = createElement('div', { className: 'checkmark-finished' });
        const checkmarkInner = createElement('div', { className: 'checkmark-inner' });
        const txtCheckMark = createElement('span', { textContent: 'Completed!' });

        checkmarkInner.append(
            this.#createImage(`${this.#course.illus_assets}icon-default/checkmark-finished.png`),
            !isFirst ? txtCheckMark : ''
        );
        checkmark.appendChild(checkmarkInner);
        return checkmark;
    }

    #createFootPrint({ footer, completed }, index) {
        //const onlyOneActionWithoutFirst = this.#actions.length  === 2 && !this.#hasValidFirstAction;
        const onlyOneActionWithoutFirst = this.#actions.length < 4 || (!this.#hasValidFirstAction && this.#actions.length === 4);
        if (onlyOneActionWithoutFirst && footer.type === 'flag') {
            const footprintElement = this.#createFootprintElement(
                {
                    type: 'footprint',
                    className: `tutorial-action-footprint--second-custom`,
                    foot: {
                        count: this.#actions.length === 2 ? 3 : 2,
                        src: `${this.#course.illus_assets}${this.#course.illustration}/footprints/left_${completed ? 'dark' : 'light'}.png`,
                        direction: 'right'
                    }
                },
                completed,
                index
            );

            const flagElement = this.#createFlagElement(footer);
            const container = createElement('div', { className: 'tutorial-footprint-flag-combo' });
            container.append(footprintElement, flagElement);
            return container;
        }

        return footer.type === 'footprint'
            ? this.#createFootprintElement(footer, completed, index)
            : this.#createFlagElement(footer);
    }

    #createFootprintElement(footer, completed, index) {
        const { className, foot } = footer;
        const footprint = createElement('div', {
            className: `tutorial-action-footprint ${className}`,
            'data-total-action': this.#actions.length
        });

        const inner = createElement('div', {
            className: `tutorial-action-footprint-inner ${completed ? 'finished' : 'unfinished'} direction-${foot.direction}`
        });

        for (let i = 0; i < foot.count; i++) {
            inner.appendChild(this.#createImage(foot.src));
        }

        footprint.appendChild(inner);
        return footprint;
    }

    #createFlagElement({ src, text }) {
        const flag = createElement('div', { className: 'tutorial-flag-end' });
        const animalMap = {
            cat: '1.png',
            dog: '2.png',
            horse: '4.png',
            penguin: '1.png',
            pig: '6.png',
        };

        const imgName = animalMap[this.#course.illustration] || '1.png';

        const imgFlag = createElement('div', { className: 'img-flag' });  
        const imgAnimal = createElement('div', { className: 'img-animal' });
        imgAnimal.appendChild(
            this.#createImage(`${this.#course.illus_assets}${this.#course.illustration}/animals/${imgName}`)
        );


        imgFlag.appendChild(this.#createImage(src));
        flag.append(
            imgAnimal,
            imgFlag,
            createElement('div', { className: 'tutorial-text', textContent: text })
        );
        return flag;
    }

    #createImage(src) {
        return createElement('img', { src, alt: '' });
    }

    #evtHandleAction(actionId) {
        const actionIndex = this.#actions.findIndex(a => a.internalId === actionId);
        if (actionIndex === -1 || this.#actions[actionIndex].is_dummy) return;
        
        const action = this.#actions[actionIndex];
        this.postMessage('openTask', {
            actionId: action.id,
            is_first_action: action.is_first_action ?? false,
            isValid: this.#isPreviousComplete(actionIndex)
        });
    }

    // =========================================================================
    // PRIVATE CONVERSION METHODS
    // =========================================================================

    #convertPhysicalPixelsToVh(physicalPixels, resolution, dpr = 3) {
        if (typeof physicalPixels !== 'number' || physicalPixels < 0) {
            throw new Error('Physical pixels must be a non-negative number');
        }
        if (typeof resolution !== 'string' || !/^\d+x\d+$/.test(resolution)) {
            throw new Error('Resolution must be in "widthxheight" format');
        }

        const [, physicalHeight] = resolution.split('x').map(Number);
        const viewportHeight = physicalHeight / dpr;
        const cssPixels = physicalPixels / dpr;
        return Number(((cssPixels / viewportHeight) * 100).toFixed(2));
    }
}

const tutorial = new Tutorial();

/**
 * Initializes the tutorial app with provided data.
 * @param {Object|string} data - Initial data or JSON string.
 * @returns {boolean} Whether initialization was successful.
 */
window.initTutorialApp = function (data) {
    let error = null;
    let isSuccess = false;
    try {
        tutorial.init(data);
        isSuccess = true;
    } catch (err) {
        error = err.message;
    }
    tutorial.postMessage('loadFinished', { error, success: isSuccess });
    return isSuccess;
};

tutorial.postMessage('javascriptLoaded', { success: true });

})();
window.initTutorialApp({
    "type": "ios",
    "device": "iPhone13",
    "data": {
        "next_consulting": {},
        "id": "14",
        "title": "swift flow_chart",
        "date": "2025/07/07",
        "bg_color": "#f6fcf2",
        "title_color": "",
        "survey": "SWFIT flow chart",
        "icon": "https://www.media.learningpocket.com/uploads/course/v5a5B1VEco/N874lapmA6ok91en.png",
        "illustration": "cat", 
        "count_action": 6,
        "total_action": 6,
        "type": "FLOW_CHART",
        "progress_notify": "ぽけっとを使ってみよう！",
        "progress_msg": "コンプリートまであと__percent__%！",
        "illus_assets": "https://test.learningpocket.com/assets/images/tutorials/",
        "html": "https://www.test.learningpocket.com/tutorials/index.html",
        "animal_icons": [
            "1.png",
            "3.png",
            "6.png",
            "1.png",
            "4.png",
            "2.png",
            // "1.png"
        ],
         "decor_icons": [
            "4.png",
            "3.png",
            "2.png",
            "2.png",
            "4.png",
            "4.png",
            // "1.png"
        ],
        "first_action": {
            "id": "1",
            "icon": "https://www.test.learningpocket.com/uploads/column/K59tgcQf1jg/j749x2k5ndPkH1lo.jpeg",
            "thumb": "https://test.learningpocket.com/assets/images/tutorials/complete.png?v=v1.1",
            "answer": "初回アクション編集個別タイトルタスク設定",
            "title": "初回アクション編集個別タイトルタスク設定",
            "bg_color": "#d5ffcc",
            "bd_color": "#49E826",
            "spec_content": "di SWIpsoXift",
            "method_redirect": "432",
            "cate_content": "SPECIAL",
            "target_page": "column",
            "finished": false,
            "disabled": false
        },
        "actions": [
            {
                "id": "756",
                "icon": "https://test.learningpocket.com/assets/images/tutorials/money.png",
                "title": "Duy-FLOWCHART 6　&gt; 1",
                "sub_title": "Duy-FLOWCHART 6　&gt; 1",
                "thumb": "https://test.learningpocket.com/assets/images/tutorials/complete.png?v=v1.1",
                "bg_color": "#b3b3b3",
                "bd_color": "#787878",
                "order": 1,
                "count_task": 1,
                "finished": false,
                "tasks": [
                    {
                        "id": "3826",
                        "title": "Duy-FLOWCHART 6　&gt; 1",
                        "thumb": "https://www.test.learningpocket.com/uploads/course/07k6ANq4fF/b015WsEegftkh17R.png",
                        "spec_content": "",
                        "method_redirect": "top_access",
                        "cate_content": "ACCESS",
                        "target_page": "lesson",
                        "order": 1,
                        "finished": false
                    }
                ]
            },
            {
                "id": "757",
                "icon": "https://test.learningpocket.com/assets/images/tutorials/database.png",
                "title": "Duy-FLOWCHART 6　&gt; 2",
                "sub_title": "Duy-FLOWCHART 6　&gt; 2",
                "thumb": "https://test.learningpocket.com/assets/images/tutorials/complete.png?v=v1.1",
                "bg_color": "#999999",
                "bd_color": "#333232",
                "order": 2,
                "count_task": 1,
                "finished": true,
                "tasks": [
                    {
                        "id": "3827",
                        "title": "Duy-FLOWCHART 6　&gt; 2",
                        "thumb": "https://www.test.learningpocket.com/uploads/course/07k6ANq4fF/E9258s9eAfKkb1uO.png",
                        "spec_content": "",
                        "method_redirect": "top_access",
                        "cate_content": "ACCESS",
                        "target_page": "document",
                        "order": 1,
                        "finished": false
                    }
                ]
            },
            {
                "id": "758",
                "icon": "https://test.learningpocket.com/assets/images/tutorials/class.png",
                "title": "Duy-FLOWCHART 6　&gt; 3",
                "sub_title": "Duy-FLOWCHART 6　&gt; 3",
                "thumb": "https://test.learningpocket.com/assets/images/tutorials/complete.png?v=v1.1",
                "bg_color": "#eaccff",
                "bd_color": "#9826E8",
                "order": 3,
                "count_task": 1,
                "finished": false,
                "tasks": [
                    {
                        "id": "3828",
                        "title": "Duy-FLOWCHART 6　&gt; 3",
                        "thumb": "https://www.test.learningpocket.com/uploads/course/07k6ANq4fF/1hp5Ls7ewfrk51XK.png",
                        "spec_content": "",
                        "method_redirect": "top_access",
                        "cate_content": "ACCESS",
                        "target_page": "career-consulting",
                        "order": 1,
                        "finished": false
                    }
                ]
            },
            // {
            //     "id": "759",
            //     "icon": "https://test.learningpocket.com/assets/images/tutorials/exclamation_mark.png",
            //     "title": "Duy-FLOWCHART 6　&gt; 4",
            //     "sub_title": "Duy-FLOWCHART 6　&gt; 4",
            //     "thumb": "https://test.learningpocket.com/assets/images/tutorials/complete.png?v=v1.1",
            //     "bg_color": "#ffdfab",
            //     "bd_color": "#E89000",
            //     "order": 4,
            //     "count_task": 1,
            //     "finished": true,
            //     "tasks": [
            //         {
            //             "id": "3829",
            //             "title": "Duy-FLOWCHART 6　&gt; 4",
            //             "thumb": "https://www.test.learningpocket.com/uploads/course/07k6ANq4fF/oqd5hsLesfTkC10A.png",
            //             "spec_content": "",
            //             "method_redirect": "top_access",
            //             "cate_content": "ACCESS",
            //             "target_page": "examination",
            //             "order": 1,
            //             "finished": false
            //         }
            //     ]
            // },
            // {
            //     "id": "760",
            //     "icon": "https://test.learningpocket.com/assets/images/tutorials/database.png",
            //     "title": "Duy-FLOWCHART 6　&gt; 5",
            //     "sub_title": "Duy-FLOWCHART 6　&gt; 5",
            //     "thumb": "https://test.learningpocket.com/assets/images/tutorials/complete.png?v=v1.1",
            //     "bg_color": "#ece3be",
            //     "bd_color": "#D7B528",
            //     "order": 5,
            //     "count_task": 1,
            //     "finished": false,
            //     "tasks": [
            //         {
            //             "id": "3830",
            //             "title": "Duy-FLOWCHART 6　&gt; 5",
            //             "thumb": "https://www.test.learningpocket.com/uploads/course/07k6ANq4fF/E3l6YsBeGfnkM16U.png",
            //             "spec_content": "",
            //             "method_redirect": "top_access",
            //             "cate_content": "ACCESS",
            //             "target_page": "diagnostic-content",
            //             "order": 1,
            //             "finished": false
            //         }
            //     ]
            // },
            // {
            //     "id": "761",
            //     "icon": "https://test.learningpocket.com/assets/images/tutorials/money.png",
            //     "title": "Duy-FLOWCHART 6　&gt; 6",
            //     "sub_title": "Duy-FLOWCHART 6　&gt; 6",
            //     "thumb": "https://test.learningpocket.com/assets/images/tutorials/complete.png?v=v1.1",
            //     "bg_color": "#ece3be",
            //     "bd_color": "#D7B528",
            //     "order": 6,
            //     "count_task": 1,
            //     "finished": true,
            //     "tasks": [
            //         {
            //             "id": "3831",
            //             "title": "Duy-FLOWCHART 6　&gt; 6",
            //             "thumb": "https://www.test.learningpocket.com/uploads/course/07k6ANq4fF/Tcn6ysVe7fCkA1K4.png",
            //             "spec_content": "",
            //             "method_redirect": "top_access",
            //             "cate_content": "ACCESS",
            //             "target_page": "column",
            //             "order": 1,
            //             "finished": false
            //         }
            //     ]
            // }
        ]
    },
    "height_top_layout": 150,
    "resolution": "1170x2532",
    "padding_bottom": "true"
});