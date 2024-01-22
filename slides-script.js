// There must be frame_changes array defined before script including 
// (in the other <script> block for example), 
// in which will be written per frame changes.
// Also, it is necessary for the first one frame to contain
// values for all (id, attribute) pairs which will be changing further. 
frame_changes;

// Script works with <svg> tag with id, specified in svg_id variable.
svg_id;

// Script works with text element with id equals to slide_counter to update slide number.
slide_counter;

// Script works with text element with id equals to speed_tracker to update slide number.
speed_tracker;

// Get link to the svg element.
let svg_doc = document.getElementById(svg_id);

// Total number of frames.
let frame_count = frame_changes.length;
// Index of the current frame.
let frame_index = 0;

// Returns key of (id, attr) pair.
function key_by_id_attr(id, attr) {
    return id + "___" + attr;
}

// Holds for every (id, attribute) pair frame indexes on which attribute
// is changed for the object with specified id.
let change_map = new Map();

// Fill the change map.
for (let i = 0; i < frame_changes.length; i++) {
    for (let j = 0; j < frame_changes[i].length; j++) {
        let id = frame_changes[i][j][0];
        let attr = frame_changes[i][j][1];
        let value = frame_changes[i][j][2];
        let key = key_by_id_attr(id, attr);
        if (!change_map.has(key)) {
            change_map.set(key, []);
        }
        change_map.get(key).push([i, value]);
    }
}

// Finds the latest value of attr for object with specified id up to the specified frame index.
function find_previous_attr_value(id, attr, frame) {
    let key = key_by_id_attr(id, attr);
    let array = change_map.get(key);
    let left = 0;
    let right = array.length;
    while (left + 1 < right) {
        let mid = Math.floor((left + right) / 2);
        if (array[mid][0] <= frame) {
            left = mid;
        } else {
            right = mid;
        }
    }
    return array[left][1];
}

// Allows to set attribute to object.
function set_attr(id, attr, value) {
    if (attr == "innerHTML") {
        document.getElementById(id).innerHTML = value;    
    } else {
        svg_doc.getElementById(id).setAttribute(attr, value);
    }
}

// Function draws the next frame.
function draw_next_frame() {
    frame_index += 1;
    if (frame_index == frame_count) {
        frame_index = 0;
    }
    for (let change_id = 0; change_id < frame_changes[frame_index].length; ++change_id) {
        let id = frame_changes[frame_index][change_id][0];
        let attr = frame_changes[frame_index][change_id][1];
        let value = frame_changes[frame_index][change_id][2];
        set_attr(id, attr, value);
    }
    update_slide_counter();
}

// Function draw the previous frame.
function draw_previous_frame() {
    if (frame_index == 0) {
        for (let i = 0; i < frame_count - 1; ++i) {
            draw_next_frame();
        }
    } else {
        for (let change_id = 0; change_id < frame_changes[frame_index].length; ++change_id) {
            let id = frame_changes[frame_index][change_id][0];
            let attr = frame_changes[frame_index][change_id][1];
            let value = frame_changes[frame_index][change_id][2];
            let previous_value = find_previous_attr_value(id, attr, frame_index - 1);
            if (previous_value != value) {
                set_attr(id, attr, previous_value);
            }
        }
        frame_index -= 1;
    }
    update_slide_counter();
}

// Allows to automatically play slides with specified interval.
let is_playing = false;
let play_interval_id = 0;
let play_interval_value = 100;
const PLAY_INTERVAL_DEFAULT_DELTA = 5;
const PLAY_INTERVAL_MIN_VALUE = 5;
const PLAY_INTERVAL_STEP = 50;

// Stop playing slides.
function stop_playing() {
    if (is_playing) {
        clearInterval(play_interval_id);
        is_playing = false;
        play_index = 0;
    }
}

// Start playing slides.
function start_playing() {
    if (!is_playing) {
        play_interval_id = setInterval(play_next_frame, play_interval_value);
        is_playing = true;
    }
}

// Reset automatic slide show.
function reset_slide_show() {
    if (is_playing) {
        stop_playing();
        start_playing();
    }
}

// Plays the next frame. 
// If the current frame is the last one, playing is stopped.
function play_next_frame() {
    if (frame_index == frame_count - 1) {
        stop_playing();
        return;
    } else {
        draw_next_frame();
    }
}

// Specifies slide counter HTML text element.
let slide_counter_text = document.getElementById(slide_counter);

// Allows to update slide context HTML text element.
function update_slide_counter() {
    slide_counter_text.innerHTML = "Slide: " + (frame_index + 1) + "/" + frame_count;
}

// Specifies speed tracker HTML text element.
let speed_tracker_text = document.getElementById(speed_tracker);
function update_speed_tracker() {
    speed_tracker_text.innerHTML = "Interval: " + play_interval_value + "ms per slide";
}

// Add all necessary keyboard listeners.
document.addEventListener('keydown', (e) => {
    if (e.code === "ArrowRight") { // Move to the next slide.
        stop_playing();
        draw_next_frame();
    } else if (e.code == "ArrowLeft") { // Move to the previous slide.
        stop_playing();
        draw_previous_frame();
    } else if (e.code == "Space") { // Manage slides show.
        if (is_playing) {
            stop_playing();
        } else {
            start_playing();
        }
    } else if (e.code == "ArrowUp") { // Increase slide change interval.
        console.log("Allow Up");
        play_interval_value += 
            PLAY_INTERVAL_DEFAULT_DELTA * Math.ceil((play_interval_value + PLAY_INTERVAL_DEFAULT_DELTA) / PLAY_INTERVAL_STEP);
        update_speed_tracker();
        reset_slide_show();
    } else if (e.code == "ArrowDown") { // Decrease slide change interval.
        console.log("Allow Up");
        play_interval_value -= 
            PLAY_INTERVAL_DEFAULT_DELTA * Math.ceil(play_interval_value / PLAY_INTERVAL_STEP);
        if (play_interval_value < PLAY_INTERVAL_MIN_VALUE) {
            play_interval_value = PLAY_INTERVAL_MIN_VALUE;
        }
        update_speed_tracker();
        reset_slide_show();
    }
});

// When view is loaded, we need to update text content.
function on_load() {
    update_slide_counter();
    update_speed_tracker();
}

// Prevent scrolling in window.
window.addEventListener("keydown", function(e) {
    if(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

// SVG viewBox in format (x1, y1, x2, y2)
var viewBoxValues = svg_doc.getAttribute("viewBox").split(" ");

// Update SVG viewBox values
function update_view_box(x1, y1, x2, y2) {
    viewBoxValues[0] = x1;
    viewBoxValues[1] = y1;
    viewBoxValues[2] = x2;
    viewBoxValues[3] = y2;
    svg_doc.setAttribute("viewBox", viewBoxValues.join(" "));
}

// Implementation of svg scaling.
let scale = 1.0;
const SCALE_FACTOR = -0.000000001;

// Svg point, created once.
var pt = svg_doc.createSVGPoint();

// Wheel zoom handler.
function wheelZoom(event) {
    event.preventDefault();

    pt.x = event.clientX;
    pt.y = event.clientY;

    // Transformed point relative to enclosing SVG.
    pt = pt.matrixTransform(svg_doc.getScreenCTM().inverse());

    let scale_delta = SCALE_FACTOR * event.deltaY;

    let new_x1 = pt.x - (pt.x - viewBoxValues[0]) * scale_delta;
    let new_y1 = pt.y - (pt.y - viewBoxValues[1]) * scale_delta;

    let new_x2 = pt.x + (viewBoxValues[2] - pt.x) * scale_delta;
    let new_y2 = pt.y + (viewBoxValues[3] - pt.y) * scale_delta;

    console.log(new_x1, new_y1, new_x2, new_y2);

    // Update viewBox.
    update_view_box(new_x1, new_y1, new_x2, new_y2);
}

// svg_doc.addEventListener("wheel", wheelZoom);

// Add on load listener.
document.addEventListener("DOMContentLoaded", function() {
    on_load();
});