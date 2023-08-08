/** ============================ */
/** ========  GLOBAL VARS   ====== */
/** ============================ */
const GSHEETS_URL =
    'https://opensheet.elk.sh/1tD8HiKg5KLKKomSIPpe7nzZ2F5ryHQJEk9pGgdjpYoc'
const CONFIGS_GSHEETS_URL = `${GSHEETS_URL}/config%20panel`
const IMAGES_GSHEETS_URL = `${GSHEETS_URL}/images_public`

let CONFIGS_ARRAY, IMAGE_URLS
let tabs
let tab_count = 0
const CONFIGS_OBJECT = {}
const BASE_CONFIGS = []
const OVERLAY_CONFIGS = []
const preloaded_images = {}

const current_configuration = {}
let current_slide_index = 0
/** ============================ */
/** ========  FUNCTIONS   ====== */
/** ============================ */

function prettifyConfigName(str) {
    return str.replaceAll('_', ' ')
}

function getAllArrayCombos(arrayOfArrays) {
    return arrayOfArrays.reduce(
        (a, b) =>
            a.flatMap((x) => b.map((y) => [x + (x === '' ? '' : '-') + y])),
        ['']
    )
}

function removeSpaces(str) {
    return str.replace(/\s+/g, '')
}

function commaSeparatedStrToArray(str) {
    return removeSpaces(str).split(',')
}

function getOverlaySlug(config_name, custom_configuration = {}) {
    let image_slug = ''
    // color
    if (CONFIGS_OBJECT[config_name].color_dependent) {
        image_slug += `${
            custom_configuration.color || current_configuration.color
        }-`
    }
    // config name
    image_slug += config_name
    // option
    if (CONFIGS_OBJECT[config_name].option_type === 'multiple_choice') {
        image_slug += `-${
            custom_configuration.option || current_configuration[config_name]
        }`
    }
    return getImageURLFromSlug(image_slug)
}

function preloadImage(image_url) {
    if (!preloaded_images[image_url]) {
        console.log(`preloading ${image_url}`)
        let img = new Image()
        img.src = image_url
        preloaded_images[image_url] = true
    }
}

function getBaseConfigImageURLs(config_to_load_index) {
    let array_combos = []
    // get values of previous base configs
    for (let i = 0; i < config_to_load_index; i++) {
        array_combos.push([current_configuration[BASE_CONFIGS[i].name]])
    }

    // get options for current slide config
    array_combos.push(CONFIGS_ARRAY[config_to_load_index].options)

    // get default values for rest of base configs
    for (let i = config_to_load_index + 1; i < BASE_CONFIGS.length; i++) {
        array_combos.push([current_configuration[BASE_CONFIGS[i].name]])
    }
    return getAllArrayCombos(array_combos).map((slug) =>
        getImageURLFromSlug(slug)
    )
}

function getOverlayConfigImageURLs() {
    let overlay_images = []
    OVERLAY_CONFIGS.forEach((config) => {
        if (
            config.parent_config !== '' &&
            config.parent_dependency_value !==
                current_configuration[config.parent_config]
        ) {
            return
        }
        if (config.option_type === 'multiple_choice') {
            config.options.forEach((option) => {
                overlay_images.push(getOverlaySlug(config.name, { option }))
            })
        } else {
            overlay_images.push(getOverlaySlug(config.name))
        }
    })
    return overlay_images
}

function loadSlideImages(slide_index_to_load) {
    let images_to_load = []
    if (slide_index_to_load < BASE_CONFIGS.length) {
        // slide is a base config
        images_to_load = getBaseConfigImageURLs(slide_index_to_load)
    } else {
        // slide is overlays
        images_to_load = getOverlayConfigImageURLs()
    }
    images_to_load.forEach((image_url) => {
        preloadImage(image_url)
    })
}

function getImageURLFromSlug(image_slug) {
    return IMAGE_URLS[image_slug]
}

function updateBaseImage() {
    let image_slug = ''
    BASE_CONFIGS.forEach((config, i) => {
        image_slug += current_configuration[config.name]
        if (i < BASE_CONFIGS.length - 1) {
            image_slug += '-'
        }
    })
    $('#product-image__base')
        .fadeOut(600, function () {
            $(this).attr('src', getImageURLFromSlug(image_slug))
        })
        .fadeIn(600)
}

function updateOverlay(config_name) {
    // if already exists, remove
    if ($(`#product-image__${config_name}`).length) {
        $(`#product-image__${config_name}`).remove()
    }
    if (
        (CONFIGS_OBJECT[config_name].option_type === 'true_false' &&
            current_configuration[config_name]) ||
        CONFIGS_OBJECT[config_name].option_type === 'multiple_choice'
    ) {
        $('#pb-image-container').prepend(`
				<img
					id="product-image__${config_name}"
                    ${insertConfigData(CONFIGS_OBJECT[config_name])}
					class="product-image product-image__overlay" 
					src="${getOverlaySlug(config_name)}"
					onerror="this.style.display='none'">
			`)
    }
}

function addTab(tab_name) {
    tab_count += 1
    $('#pb-configs__tabs-container').append(
        `
        <a class="pb-configs__tab-container" data-tab-number=${tab_count-1}>
            <div class="pb-configs__tab-number">
                <span>${tab_count}</span>
            </div>
            <h4 class="pb-configs__tab">${tab_name}</h4>
        </a>
        `
    )
}

function plusSlides (n) {
    showSlides((current_slide_index += n))
}

function showSlides(n) {
    loadSlideImages(current_slide_index)
    $(tabs).each(function () {
        if ($(this).attr("data-tab-number") <= current_slide_index) {
            $(this).addClass('active')
        } else {
            $(this).removeClass('active')
        }
    })
    
    let slides = $('.pb-configs__slide-container')
    $('#pb-configs__plusSlides-button-next').css('opacity', 1)
    $('#pb-configs__plusSlides-button-prev').css('opacity', 1)
    if (n >= slides.length - 1) {
        // last slide
        current_slide_index = slides.length - 1
        $('#pb-configs__plusSlides-button-next').css('opacity', 0)
    } else if (n <= 0) {
        // first slide
        current_slide_index = 0
        $('#pb-configs__plusSlides-button-prev').css('opacity', 0)
    }

    $('.pb-configs__slide-container').hide()
    $(slides[current_slide_index]).fadeIn()
}

function insertConfigData(config) {
    return `
        data-config-name="${config.name}" 
        data-config-type="${config.type}" 
        data-color-dependent="${config.color_dependent}" 
        data-is-parent="${config.is_parent}"
        data-parent-config="${config.parent_config}"
        data-parent-dependency-value="${config.parent_dependency_value}"
    `
}

/** ============================ */
/** ========  START   ========== */
/** ============================ */

async function fetchGSheetsData() {
    const [configsResponse, imagesResponse] = await Promise.all([
        fetch(CONFIGS_GSHEETS_URL),
        fetch(IMAGES_GSHEETS_URL)
    ])

    const configs = await configsResponse.json()
    const images = await imagesResponse.json()

    return [configs, images]
}

function processConfig(config) {
    config.name = removeSpaces(config.name)
    config.parent_dependency_value = removeSpaces(
        config.parent_dependency_value
    )
    config.options = commaSeparatedStrToArray(config.options)
    config.is_parent = config.is_parent === 'TRUE'
    config.color_dependent = config.color_dependent === 'TRUE'
    if (config.type === 'base') {
        BASE_CONFIGS.push(config)
        // auto select the first option in each base config
        current_configuration[config.name] = config.options[0]
        addTab(prettifyConfigName(config.name))
    } else {
        OVERLAY_CONFIGS.push(config)
        current_configuration[config.name] = false
    }
    CONFIGS_OBJECT[config.name] = config
}

fetchGSheetsData()
    .then(([configs, images]) => {
        console.log(
            `fetched config gsheets data from ${CONFIGS_GSHEETS_URL} and ${IMAGES_GSHEETS_URL}`
        )
        CONFIGS_ARRAY = configs
        IMAGE_URLS = images[0]
        // sort through configs array and insert config groups into DOM
        let html_to_insert = ''
        let first_overlay_flag = false
        CONFIGS_ARRAY.forEach((config, i) => {
            processConfig(config)

            // generate html to insert into DOM
            const is_first_overlay =
                config.type === 'overlay' && !first_overlay_flag // if base option or this is the first overlay option
            if (is_first_overlay) {
                first_overlay_flag = true
            }

            // append starting div if at beginning of slide container
            if (config.type === 'base' || is_first_overlay) {
                html_to_insert += `<div class="pb-configs__slide-container"
								data-name="${is_first_overlay ? 'add_ons' : config.name}"
								${i !== 0 ? 'style="display:none"' : ''}>` // hide other slides
            }

            // append div for config container
            html_to_insert += `<div class="pb-configs__config-container"
                                ${insertConfigData(config)}"
							${
                                config.parent_config !== '' &&
                                current_configuration[config.parent_config] !==
                                    config.parent_dependency_value
                                    ? 'style="display:none"'
                                    : ''
                            }>` // hide children config

            if (config.option_type === 'multiple_choice') {
                // insert title for config if on overlay slide
                if (config.type === 'overlay') {
                    html_to_insert += `<h4 class="pb-configs__title">${prettifyConfigName(
                        config.name
                    )}</h4>`
                }
                config.options.forEach((option) => {
                    // insert radio button for each option
                    html_to_insert += `
                        <div class="input-container radio-item">
                                <input type="radio"
                                id="${config.name}-${option}"
                                name="${config.name}" 
                                value="${option}" 
                                ${config.type === 'base' && option === config.options[0] ? 'checked' : ''}
                                ${insertConfigData(config)}">
                                <label class="noselect ${config.name === "color" ? `label-color label-${option}` : ''}" for="${config.name}-${option}">
                                    ${prettifyConfigName(option)}
                                </label>
                            </div>
                        `
                    // if color, insert css that will style the radio color swatch
                    if (config.name === "color") {
                        html_to_insert += `
                        <style>
                            .label-${option}:before {
                                border-color: ${option} !important;
                                background-color: ${option} !important;
                            }
                        </style>
                        `
                    }
                })
            } else if (config.option_type === 'true_false') {
                // insert checkbox for true/false
                html_to_insert += `
			<div class="input-container checkbox-item">
				<input type="checkbox"
					id="${config.name}"
					name="${config.name}"
					value="${config.name}"
					${insertConfigData(config)}">
				<label class="noselect" for="${config.name}">
					${prettifyConfigName(config.name)}
				</label>
			</div>
			`
            }
            html_to_insert += '</div>' // close div config-container div
            const is_last_overlay = i === CONFIGS_ARRAY.length
            if (config.type === 'base' || is_last_overlay) {
                html_to_insert += '</div>' // close slide div
            }
        })

        $('#pb-configs__form').append(html_to_insert)
        addTab('add ons')

        tabs = $('.pb-configs__tab-container')

        updateBaseImage()
        $(tabs[0]).addClass('active')
        showSlides(current_slide_index)
        loadSlideImages(current_slide_index)

        /** ============================ */
        /** =====  EVENT HANDLERS  ===== */
        /** ============================ */

        $('#pb-configs__plusSlides-button-prev').click(() => plusSlides(-1))
        $('#pb-configs__plusSlides-button-next').click(() => plusSlides(1))

        $(".pb-configs__tab-container").click(function () {
            const next_slide_index = $(this).attr("data-tab-number");
            console.log(`next_slide_index: ${next_slide_index}, current_slide_index: ${current_slide_index}`)
            // showSlides()
            if (current_slide_index !== next_slide_index) {
                current_slide_index = next_slide_index;
                showSlides(current_slide_index)
            }
        })

        // handle switching base image
        $('input[type=radio][data-config-type=base]').on('change', function () {
            const config_name = $(this).prop('name')
            current_configuration[config_name] = $(this).val()
            updateBaseImage()
        })

        // handle color changing
        $('input[name=color]').on('change', function () {
            $('img[data-color-dependent=true]').each(function () {
                $(this)
                    .fadeOut(600, function () {
                        $(this).attr(
                            'src',
                            getOverlaySlug($(this).attr('data-config-name'))
                        )
                    })
                    .fadeIn(600)
            })
        })

        // handle overlay add/remove
        $('input[data-config-type=overlay]').on('change', function () {
            const config_name = $(this).prop('name')
            current_configuration[config_name] = $(this).prop(
                CONFIGS_OBJECT[config_name].option_type === 'multiple_choice'
                    ? 'value'
                    : 'checked'
            )
            updateOverlay(config_name)
        })

        // handle hide/show children of parent configs
        $('input[data-is-parent=true]').on('change', function () {
            const config_name = $(this).prop('name')

            // remove overlays from other option
            $(`img[data-parent-config=${config_name}]`).each(function () {
                $(this).hide()
            })

            // hide/show divs containing configs
            $(
                `.pb-configs__config-container[data-parent-config=${config_name}`
            ).each(function () {
                // show if parent dependency value matches current input value
                current_configuration[config_name] ==
                $(this).attr('data-parent-dependency-value')
                    ? $(this).show()
                    : $(this).hide()
            })
        })
    })
    .catch((error) => {
        console.error(error)
    })
