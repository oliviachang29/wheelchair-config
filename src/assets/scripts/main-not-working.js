// todo change all == to ===

/** ============================ */
/** ========  GLOBAL VARS   ====== */
/** ============================ */
const GSHEETS_URL =
    'https://opensheet.elk.sh/1tD8HiKg5KLKKomSIPpe7nzZ2F5ryHQJEk9pGgdjpYoc'
const CONFIGS_GSHEETS_URL = `${GSHEETS_URL}/config%20panel`
const IMAGES_GSHEETS_URL = `${GSHEETS_URL}/images_public`

// const CONFIGS_ARRAY = JSON.parse(
// 	'[{"":"","name":"color","type":"base","parent":"","parent_dependency":"","option_type":"multiple_choice","color_dependent":"TRUE","options":"orange, red, blue","number of options":"3"},{"":"","name":"fabric","type":"base","parent":"","parent_dependency":"","option_type":"multiple_choice","color_dependent":"TRUE","options":"solid, kitenge","number of options":"2"},{"":"","name":"seat_back","type":"base","parent":"","parent_dependency":"","option_type":"multiple_choice","color_dependent":"TRUE","options":"hard_seat_back, soft_seat_back","number of options":"2"},{"":"","name":"table","type":"overlay","parent":"","parent_dependency":"","option_type":"true_false","color_dependent":"TRUE","options":"yes, no","number of options":"2"},{"":"","name":"tricycle_attachment","type":"overlay","parent":"seat back","parent_dependency":"soft_seat_back","option_type":"true_false","color_dependent":"TRUE","options":"yes, no","number of options":"2"},{"":"","name":"headrest","type":"overlay","parent":"seat back","parent_dependency":"hard_seat_back","option_type":"true_false","color_dependent":"TRUE","options":"yes, no","number of options":"2"},{"":"","name":"harness","type":"overlay","parent":"seat back","parent_dependency":"hard_seat_back","option_type":"true_false","color_dependent":"FALSE","options":"yes, no","number of options":"2"},{"":"","name":"lateral_support","type":"overlay","parent":"seat back","parent_dependency":"hard_seat_back","option_type":"true_false","color_dependent":"FALSE","options":"yes, no","number of options":"2"},{"":"","name":"hip_belt","type":"overlay","parent":"seat back","parent_dependency":"hard_seat_back","option_type":"true_false","color_dependent":"FALSE","options":"yes, no","number of options":"2"},{"":"","name":"knee_separator","type":"overlay","parent":"","parent_dependency":"","option_type":"true_false","color_dependent":"FALSE","options":"yes, no","number of options":"2"}]'
// )
// const CONFIGS_ARRAY = JSON.parse(
//     '[{"":"","name":"color","type":"base","is_parent":"FALSE","parent_config":"","parent_dependency_value":"","option_type":"multiple_choice","color_dependent":"TRUE","options":"orange, red, blue","number of options":"3"},{"":"","name":"fabric","type":"base","is_parent":"FALSE","parent_config":"","parent_dependency_value":"","option_type":"multiple_choice","color_dependent":"TRUE","options":"solid, kitenge","number of options":"2"},{"":"","name":"seat_back","type":"base","is_parent":"TRUE","parent_config":"","parent_dependency_value":"","option_type":"multiple_choice","color_dependent":"TRUE","options":"hard_seat_back, soft_seat_back","number of options":"2"},{"":"","name":"tf_color","type":"overlay","is_parent":"FALSE","parent_config":"","parent_dependency_value":"","option_type":"true_false","color_dependent":"TRUE","options":"yes, no","number of options":"2"},{"":"","name":"mc_nocolor","type":"overlay","is_parent":"FALSE","parent_config":"","parent_dependency_value":"","option_type":"multiple_choice","color_dependent":"FALSE","options":"small,large","number of options":"3"},{"":"","name":"mc_color","type":"overlay","is_parent":"FALSE","parent_config":"seat_back","parent_dependency_value":"soft_seat_back","option_type":"multiple_choice","color_dependent":"TRUE","options":"small,large","number of options":"2"},{"":"","name":"tf_nocolor","type":"overlay","is_parent":"FALSE","parent_config":"seat_back","parent_dependency_value":"hard_seat_back","option_type":"true_false","color_dependent":"FALSE","options":"yes, no","number of options":"2"}]'
// )
let CONFIGS_ARRAY, IMAGE_URLS, tabs
const CONFIGS_OBJECT = {}
const BASE_CONFIGS = []
const OVERLAY_CONFIGS = []

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
            a.flatMap((x) => b.map((y) => [x + (x == '' ? '' : '-') + y])),
        ['']
    )
}

function commaSeparatedStrToArray(str) {
    return str.replace(/\s+/g, '').split(',')
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
    if (CONFIGS_OBJECT[config_name].option_type == 'multiple_choice') {
        image_slug += `-${
            custom_configuration.option || current_configuration[config_name]
        }`
    }
    return getImageURLFromSlug(image_slug)
}

function preloadImage(image_url) {
    console.log(`preloading ${image_url}`)
    // let img = new Image()
    // img.src = image_url
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
        if (config.option_type == 'multiple_choice') {
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
	// console.log(IMAGE_URLS[image_slug])
	return IMAGE_URLS[image_slug]
    // return `/assets/images/${image_slug}.png`
}

// TODO this does not work
function updateBaseImage() {
	let image_slug = '';
	BASE_CONFIGS.forEach((config, i) => {
		console.log(`base config ${config} with value ${current_configuration[config.name]}`)
		image_slug += current_configuration[config.name]
		if (i < BASE_CONFIGS.length - 1) {
			image_slug += "-"
		}
	})
	console.log(`updating base image with value ${image_slug} and url ${getImageURLFromSlug(image_slug)}`)
    $('#product-image__base').attr('src', getImageURLFromSlug(image_slug))
}

function updateOverlay(config_name) {
    // if already exists, remove
    if ($(`#product-image__${config_name}`).length) {
        $(`#product-image__${config_name}`).remove()
    }
    if (
        (CONFIGS_OBJECT[config_name].option_type == 'true_false' &&
            current_configuration[config_name]) ||
        CONFIGS_OBJECT[config_name].option_type == 'multiple_choice'
    ) {
        $('#pb-image-container').prepend(`
				<img
					id="product-image__${config_name}"
					data-config-name="${config_name}" 
					data-color-dependent="${CONFIGS_OBJECT[config_name].color_dependent}" 
					data-is-parent="${CONFIGS_OBJECT[config_name].is_parent}"
					data-parent-config="${CONFIGS_OBJECT[config_name].parent_config}"
					data-parent-dependency-value="${
                        CONFIGS_OBJECT[config_name].parent_dependency_value
                    }"
					class="product-image product-image__overlay" 
					src="${getOverlaySlug(config_name)}"
					onerror="this.style.display='none'">
			`)
    }
}

window.plusSlides = function (n) {
    showSlides((current_slide_index += n))
    if (n > 0) {
        // if going forward a slide, load next images
        loadSlideImages(current_slide_index)
    }
    $('.pb-configs__tab').each(function () {
        $(this).removeClass('active')
    })
    $(tabs[current_slide_index]).addClass('active')
}

function showSlides(n) {
    let slides = $('.pb-configs__slide-container')
    $('#plusSlides-button-next').attr('disabled', false)
    $('#plusSlides-button-prev').attr('disabled', false)
    if (n >= slides.length - 1) {
        // last slide
        current_slide_index = slides.length - 1
        $('#plusSlides-button-next').attr('disabled', true)
    } else if (n <= 0) {
        // first slide
        current_slide_index = 0
        $('#plusSlides-button-prev').attr('disabled', true)
    }

    $('.pb-configs__slide-container').hide()
    $(slides[current_slide_index]).fadeIn()
}

/** ============================ */
/** =====  EVENT HANDLERS  ===== */
/** ============================ */

$('#plusSlides-button-prev').click(() => plusSlides(-1))
$('#plusSlides-button-next').click(() => plusSlides(1))

// handle switching base image
$('input[type=radio][data-config-type=base]').on('change', function () {
    const config_name = $(this).prop('name')
    current_configuration[config_name] = $(this).val()
	console.log('base image switched')
    updateBaseImage()
})

// handle color changing
$('input[name=color]').on('change', function () {
    $('img[data-color-dependent=true]').each(function () {
        $(this).attr('src', getOverlaySlug($(this).attr('data-config-name')))
    })
})

// handle overlay add/remove
$('input[data-config-type=overlay]').on('change', function () {
    const config_name = $(this).prop('name')
    current_configuration[config_name] = $(this).prop(
        CONFIGS_OBJECT[config_name].option_type == 'multiple_choice'
            ? 'value'
            : 'checked'
    )
    updateOverlay(config_name)
})

// handle hide/show children of parent configs
$('input[data-is-parent=true]').on('change', function () {
    // name is always config name
    const config_name = $(this).prop('name')

    // remove overlays from other option
    $(`img[data-parent-config=${config_name}]`).each(function () {
        $(this).hide()
    })

    // hide/show divs containing configs
    $(`.pb-configs__config-container[data-parent-config=${config_name}`).each(
        function () {
            // show if parent dependency value matches current input value
            current_configuration[config_name] ==
            $(this).attr('data-parent-dependency-value')
                ? $(this).show()
                : $(this).hide()
        }
    )
})

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

fetchGSheetsData()
    .then(([configs, images]) => {
        console.log(
            `fetched config gsheets data from ${CONFIGS_GSHEETS_URL} and ${IMAGES_GSHEETS_URL}`
        )
        CONFIGS_ARRAY = configs
        IMAGE_URLS = images[0]
        // sort through configs array and insert config groups into DOM
        // TODO clean this up it's so long
        let html_to_insert = ''
        let first_overlay_flag = false
        CONFIGS_ARRAY.forEach((config, i) => {
            // process config
            config.options = commaSeparatedStrToArray(config.options)
            config.is_parent = config.is_parent === 'TRUE'
            config.color_dependent = config.color_dependent === 'TRUE'
            if (config.type == 'base') {
                BASE_CONFIGS.push(config)
                // auto select the first option in each base config
                current_configuration[config.name] = config.options[0]
                $('#pb-configs__tabs-container').append(`
			<button class="pb-configs__tab">${prettifyConfigName(config.name)}</button>
		`)
            } else {
                OVERLAY_CONFIGS.push(config)
                current_configuration[config.name] = false
            }
            CONFIGS_OBJECT[config.name] = config

            // generate html to insert into DOM
            // if base option or this is the first overlay option
            const is_first_overlay =
                config.type == 'overlay' && !first_overlay_flag

            if (config.type == 'base' || is_first_overlay) {
                html_to_insert += `<div class="pb-configs__slide-container"
								data-name="${is_first_overlay ? 'add_ons' : config.name}"
								${i !== 0 ? 'style="display:none"' : ''}>` // hide other slides
            }

            html_to_insert += `<div class="pb-configs__config-container"
							data-config-name="${config.name}" 
							data-parent-config="${config.parent_config}"
							data-parent-dependency-value="${config.parent_dependency_value}"
							${
                                config.parent_config != '' &&
                                current_configuration[config.parent_config] !==
                                    config.parent_dependency_value
                                    ? 'style="display:none"'
                                    : ''
                            }>` // hide children config

            if (config.option_type == 'multiple_choice') {
                html_to_insert += `<h4 class="pb-configs__title">${prettifyConfigName(
                    config.name
                )}</h4>`
                config.options.forEach((option) => {
                    html_to_insert += `
				<div class="input-container radio-item">
					<input type="radio"
					id="${config.name}-${option}"
					name="${config.name}" 
					value="${option}" 
					${config.type === 'base' && option === config.options[0] ? 'checked' : ''}
					data-config-type="${config.type}" 
					data-color-dependent="${config.color_dependent}" 
					data-is-parent="${config.is_parent}"
					data-parent-config="${config.parent_config}"
					data-parent-dependency-value="${config.parent_dependency_value}">
					<label class="noselect" for="${config.name}-${option}">
						${prettifyConfigName(option)}
					</label>
				</div>
			  `
                })
            } else if (config.option_type == 'true_false') {
                html_to_insert += `
			<div class="input-container checkbox-item">
				<input type="checkbox"
					id="${config.name}"
					name="${config.name}"
					value="${config.name}"
					data-config-type="${config.type}"
					data-color-dependent="${config.color_dependent}"
					data-is-parent="${config.is_parent}"
					data-parent-config="${config.parent_config}"
					data-parent-dependency-value="${config.parent_dependency_value}">
				<label class="noselect" for="${config.name}">
					${prettifyConfigName(config.name)}
				</label>
			</div>
			`
            }
            html_to_insert += '</div>'
            const is_last_overlay = i == CONFIGS_ARRAY.length
            if (config.type == 'base' || is_last_overlay) {
                html_to_insert += '</div>'
            }
            if (is_first_overlay) {
                first_overlay_flag = true
            }
        })
        $('#pb-configs__form').append(html_to_insert)

        $('#pb-configs__tabs-container').append(
            `<button class="pb-configs__tab">add ons</button>`
        )

        tabs = $('.pb-configs__tab')

		console.log(current_configuration)
        updateBaseImage()
        $(tabs[0]).addClass('active')
        showSlides(current_slide_index)
        loadSlideImages(current_slide_index)
    })
    .catch((error) => {
        console.error(error)
    })
