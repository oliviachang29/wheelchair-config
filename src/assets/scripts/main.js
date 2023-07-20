const GSHEETS_URL =
    'https://opensheet.elk.sh/1tD8HiKg5KLKKomSIPpe7nzZ2F5ryHQJEk9pGgdjpYoc'
const CONFIGS_GSHEETS_URL = `${GSHEETS_URL}/config%20panel`
const IMAGES_GSHEETS_URL = `${GSHEETS_URL}/image%20link%20admin%20panel`

const CONFIGS_ARRAY = JSON.parse(
    '[{"":"","name":"color","type":"base","parent":"","parent_dependency":"","option_type":"multiple_choice","color_dependent":"TRUE","options":"orange, red, blue","number of options":"3"},{"":"","name":"fabric","type":"base","parent":"","parent_dependency":"","option_type":"multiple_choice","color_dependent":"TRUE","options":"solid, kitenge","number of options":"2"},{"":"","name":"seat_back","type":"base","parent":"","parent_dependency":"","option_type":"multiple_choice","color_dependent":"TRUE","options":"hard_seat_back, soft_seat_back","number of options":"2"},{"":"","name":"table","type":"overlay","parent":"","parent_dependency":"","option_type":"true_false","color_dependent":"TRUE","options":"yes, no","number of options":"2"},{"":"","name":"tricycle_attachment","type":"overlay","parent":"seat back","parent_dependency":"soft_seat_back","option_type":"true_false","color_dependent":"TRUE","options":"yes, no","number of options":"2"},{"":"","name":"headrest","type":"overlay","parent":"seat back","parent_dependency":"hard_seat_back","option_type":"true_false","color_dependent":"TRUE","options":"yes, no","number of options":"2"},{"":"","name":"harness","type":"overlay","parent":"seat back","parent_dependency":"hard_seat_back","option_type":"true_false","color_dependent":"FALSE","options":"yes, no","number of options":"2"},{"":"","name":"lateral_support","type":"overlay","parent":"seat back","parent_dependency":"hard_seat_back","option_type":"true_false","color_dependent":"FALSE","options":"yes, no","number of options":"2"},{"":"","name":"hip_belt","type":"overlay","parent":"seat back","parent_dependency":"hard_seat_back","option_type":"true_false","color_dependent":"FALSE","options":"yes, no","number of options":"2"},{"":"","name":"knee_separator","type":"overlay","parent":"","parent_dependency":"","option_type":"true_false","color_dependent":"FALSE","options":"yes, no","number of options":"2"}]'
)
const CONFIGS_OBJECT = {};

const current_configuration = {}
const BASE_CONFIGS = [];
CONFIGS_ARRAY.forEach((config) => {
    config.options = commaSeparatedStrToArray(config.options)
    config.color_dependent = config.color_dependent === 'TRUE';
	if (config.type == "base") {
		BASE_CONFIGS.push(config)
	} else {
		current_configuration[config.name] = false;
	}
	CONFIGS_OBJECT[config.name] = config;
})

// fetch(GSHEETS_URL)
//     .then((response) => response.json())
//     .then((data) => {

//     })

// insert config groups into DOM
let html_to_insert = ''
CONFIGS_ARRAY.forEach((config) => {
    html_to_insert += '<div class="pb-configs__config-container">'

    if (config.option_type == 'multiple_choice') {
        html_to_insert += `<h4 class="pb-configs__title">${config.name.replace(
            '_',
            ' '
        )}</h4>`
        config.options.forEach((option) => {
            html_to_insert += `
        <input type="radio" name="${config.name}" value="${option}">
        <label for="blue">${option}</label>
      `
        })
    } else if (config.option_type == 'true_false') {
        html_to_insert += `
      <input type="checkbox" name="${config.name}" value="${config.name}"><label for="${config.name}">${config.name}</label>
    `
    }
    html_to_insert += '</div>'
})
$('#pb-configs__form').append(html_to_insert)


// todo select values based on js current configuration
// auto select the first option in each base config
BASE_CONFIGS.forEach((config) => {
	const first_option = config.options[0]
	current_configuration[config.name] = first_option;
	$(`input[type=radio][name=${config.name}][value=${first_option}]`).prop("checked", true);
})


function commaSeparatedStrToArray(str) {
    return str.replace(/\s+/g, '').split(',')
}

// handle switching base image
// TODO this will not work for MC non overlays
$('input[type=radio]').on('change', function () {
    const config_name = $(this).prop('name')
    current_configuration[config_name] = $(this).val()
    updateBaseImage()
})
function updateBaseImage() {
    console.log(current_configuration)
	const image_slug = `${current_configuration.color}-${current_configuration.fabric}-${current_configuration.seat_back}.png`
	console.log(image_slug)
    $('#product-image__base').attr(
        'src',
        `/assets/images/${image_slug}`
    )
}

// TODO handle overlays for MC

// handle adding overlays
$('input[type=checkbox]').on('change', function () {
    const config_name = $(this).prop('name')
	if (current_configuration[config_name]) {
		// unchecking
		// hide overlay if already exists
		$(`#product-image__${config_name}`).remove();
	} else {
		// checking
		
		// check if config is color dependent
		const image_slug = CONFIGS_OBJECT[config_name].color_dependent ? `${current_configuration.color}-${config_name}`: config_name;

		$("#pb-image-container").prepend(`
			<img id="product-image__${config_name}" class="product-image product-image__overlay" src="/assets/images/${image_slug}.png">
		`)
	}
	
	current_configuration[config_name] = $(this).prop('checked')
    updateOverlays()
})

// TODO update color dependent overlays when color switches
function updateOverlays() {
	console.log('updating overlays')
	console.log(current_configuration)

}

updateBaseImage()
