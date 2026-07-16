<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Fenster Konfigurator</title>
  <link rel="stylesheet" href="https://droplify.de/deine-fenster24/frontend/style_now.css?v=20260710-ornament-image">
<style>

#tab4 g#handle_handle_1 path {
    fill: #fff !important;
}

#tab4 g#handle_handle_2 path {
    fill: #fff !important;
}

#tab4 g#handle_handle_3 path {
    fill: #fff !important;
}
<!-----
#tab3 .opening-svg-container svg {
    display: none;
}
----->

div#tab6 .bottom_check_point {
    display: none !important;
}


#kastenfarbe-innen .card-option img {
    border: 1px solid;
    border-radius: 50%;
}

#kastenfarbe-auen .card-option img {
    border: 1px solid;
    border-radius: 50%;
}


span.checkmark-box img {
    border-radius: unset !important;
    border: unset !important;
}


.its_my_app_work .text-input-option-block {
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: flex-start !important;
    align-content: flex-start;
}

.its_my_app_work .text-input-option-block .input-label {
  font-weight: 500;
  color: #333;
}

#inputfield h4.section-heading {
    display: none;
}

.its_my_app_work input.text-input-option {
    width: 100%;
    padding: 20px;
}

#inputfield .card-option.text-input-option-block {
    border: unset !important;
}


.its_my_app_work #dropdown1 h4.section-heading {
    display: none;
}

.its_my_app_work #dropdown1 .card-option.image-select-option-block {
    border: unset;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.its_my_app_work #dropdown1 .custom-select-dropdown img {
    width: auto !important;
    height: 50px;
    border: 1px solid;
}

.its_my_app_work #dropdown1 .custom-select-dropdown svg {
    width: auto !important;
    height: 50px;
}


.its_my_app_work #dropdown2 h4.section-heading {
    display: none;
}

.its_my_app_work #dropdown2 .card-option.image-select-option-block {
    border: unset;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.its_my_app_work #dropdown2 .custom-select-dropdown img {
    width: auto !important;
    height: 50px;
    border: 1px solid;
}

.its_my_app_work #dropdown2 .custom-select-dropdown svg {
    width: auto !important;
    height: 50px;
}


.its_my_app_work #dropdown3 h4.section-heading {
    display: none;
}

.its_my_app_work #dropdown3 .card-option.image-select-option-block {
    border: unset;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.its_my_app_work #dropdown3 .custom-select-dropdown img {
    width: auto !important;
    height: 50px;
    border: 1px solid;
}

.its_my_app_work #dropdown3 .custom-select-dropdown svg {
    width: auto !important;
    height: 50px;
}

.its_my_app_work #dropdown4 h4.section-heading {
    display: none;
}

.its_my_app_work #dropdown4 .card-option.image-select-option-block {
    border: unset;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.its_my_app_work #dropdown4 .custom-select-dropdown img {
    width: auto !important;
    height: 50px;
    border: 1px solid;
}

.its_my_app_work #dropdown4 .custom-select-dropdown svg {
    width: auto !important;
    height: 50px;
}





.its_my_app_work #anschlussprofil h4.section-heading {
    display: none;
}

.its_my_app_work #anschlussprofil .card-option.image-select-option-block {
    border: unset;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.its_my_app_work #anschlussprofil .custom-select-dropdown img {
    width: auto !important;
    height: 50px;
    border: 1px solid;
}

.its_my_app_work #anschlussprofil .custom-select-dropdown svg {
    width: auto !important;
    height: 50px;
}


.its_my_app_work #rahmenverbreiterung .card-option.image-select-option-block {
    border: unset;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.its_my_app_work #rahmenverbreiterung .custom-select-dropdown img {
    width: auto !important;
    height: 50px;
    border: 1px solid;
}

.its_my_app_work #rahmenverbreiterung .custom-select-dropdown svg {
    width: auto !important;
    height: 50px;
}


.its_my_app_work #fensterzubehr .card-option.image-select-option-block {
    border: unset;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.its_my_app_work #fensterzubehr .custom-select-dropdown img {
    width: auto !important;
    height: 50px;
    border: 1px solid;
}

.its_my_app_work #fensterzubehr .custom-select-dropdown svg {
    width: auto !important;
    height: 50px;
}


.its_my_app_work #tab6 #zubehrartikel .card-option img {
    width: 95px;
    height: 95px;
}

.its_my_app_work .image-select-option-block {
  position: relative;
}

.its_my_app_work .custom-select-dropdown {
  position: relative;
  width: 100%;
  cursor: pointer;
}

.its_my_app_work .current-selection {
  border: 1px solid #ccc;
  padding: 8px;
  border-radius: 6px;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-start;
}

.its_my_app_work .dropdown-list {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-height: 240px;
  overflow-y: auto;
}

.its_my_app_work .dropdown-list.show { display: block; }

.its_my_app_work .dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: pointer;
}

.its_my_app_work .dropdown-item:hover {
  background: #f5f5f5;
}

.its_my_app_work .dropdown-item img,
.its_my_app_work .dropdown-item svg {
  width: 30px;
  height: 30px;
}

.its_my_app_work .current-selection img,
.its_my_app_work .current-selection svg {
  width: 24px;
  height: 24px;
}




.its_my_app_work #tab6 #kastenfarbe-innen .card-option {
    flex-direction: column;
}

.its_my_app_work #tab6 #kastenfarbe-auen .card-option {
    flex-direction: column;
}


#kastenfarbe-innen .card-text {
    text-align: center;
    margin-top: 10px !important;
    margin: 0 auto;
    display: block;
}

#kastenfarbe-auen .card-text {
    text-align: center;
    margin-top: 10px !important;
    margin: 0 auto;
    display: block;
}




.its_my_app_work #tab6 .card-option img {
    width: 95px;
}

@media (min-width: 1024px) and (max-width: 1799px) {
    .its_my_app_work #tab6 .card-option img {
        width: 100% !important;
        margin-right: 0rem;
    }
}

.its_my_app_work .checkmark-box img {
    width: 24px !important;
    height: auto !important;
}

.its_my_app_work h4.section-heading {
    font-size: 20px;
}

div#rollladen-subtab svg {
    width: auto;
    height: 100px;
}

div#svgPreviewBox {
    margin-bottom: 8% !important;
}
.its_my_app_work {
  scroll-behavior: smooth;
}

.its_my_app_work .sec {
    display: flex;
    gap: 20px;
}

.its_my_app_work .sec div {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.its_my_app_work .sec div:empty {
    display: none;
}



.its_my_app_work .element-group {
    display: flex;
    flex-direction: row;
    column-gap: 20px;
}

.its_my_app_work div#formobilegroup {
    flex-direction: column !important;
}

.its_my_app_work .sidebar.mypreviousdesign svg {
    width: 300px;
    text-align: center;
    height: 300px !important;
}

/* Default: show full text */
.its_my_app_work #tabHeaderContainer .tab-link::after {
  content: attr(data-label);
}



/* On mobile (max 768px for example): show only the number */
@media (max-width: 768px) {
	.its_my_app_work #tab7 .mypreviousdesign p {
    font-size: 13px !important;
}
	.its_my_app_work #tab5 .flex-2 {
    flex: unset !important;
    width: 100%;
}

#tab3 svg#svg_preview {
    width: auto;
    height: 100%;
}

.its_my_app_work #tab6 .main {
    flex: unset;
    min-width: 100%;
}

div#tab7.active {
    margin-bottom: 6%;
    width: 100%;
}

svg#svg_preview {
    width: 100%;
    height: 100%;
}

.its_my_app_work .mypreviousdesign {
    margin-top: 0;
}



div#svgPreviewBox {
    height: 300px !important;
    width: 300px !important;
text-align: center !important;
}

div#tab7-svgPreviewBox {
    width: 300px !important;
    height: 300px !important;
}


.its_my_app_work .sidebar.mypreviousdesign svg {
    width: 250px;
    text-align: center;
    height: 250px !important;
}

.its_my_app_work .sidebar.preview-box svg {
    height: 250px !important;
    width: 250px !important;
}

.its_my_app_work #tab6 .option-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
}






.its_my_app_work .option-grid {
    margin-bottom: 1em !important;
}

.its_my_app_work .option-grid {
    margin-bottom: 1em;
}

.its_my_app_work .card-option {
    flex-direction: column !important;
}

.its_my_app_work .preview-box {
    margin-top: 2% !important;
margin-bottom: 0px;
}

  #tabHeaderContainer .tab-link {
    font-size: 14px; /* adjust if needed */
  }
  .its_my_app_work #tabHeaderContainer .tab-link::after {
    content: attr(data-id);
  }
.its_my_app_work #tabHeaderContainer .tab-link {
        background: #ffb536;
        border-radius: 0px;
               width: 100% !important;
        height: 40px;
        //color: transparent;
        position: relative;
}

.its_my_app_work .tab-link {
    line-height: 50%;
}

  .its_my_app_work #tabHeaderContainer .tab-link::after {
    color: #000; /* or inherit */
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
}



.its_my_app_work .sidebar.mypreviousdesign svg {
    overflow: visible;
 margin: 0 auto;
display: block;
  margin-bottom: 40px;
}

.its_my_app_work #tab4 .preview-box {
    flex: 0.8;
}
svg#svg_main #bottom_selected {
    display: none;
}

.its_my_app_work #tab5 .preview-box {
    flex: 0.8;
}


.its_my_app_work .mypreviousdesign{
flex: 0.8;
}

.its_my_app_work #tab7 .preview-box {
    flex: 0.8;
}




    .its_my_app_work #tab4 .svgover {
        margin: 0 auto;
        text-align: center;
    }

.its_my_app_work path[data-label="Kipp Griff Oben"] {
    display: none;
}

.its_my_app_work polyline[data-label="Dreh Links"] {
    display: none;
}

.its_my_app_work polyline[data-label="Dreh Rechts"] {
    display: none;
}

.its_my_app_work g[data-label="Festverglasung"] {
    display: none;
}

.its_my_app_work g#left-handle {
    display: none;
}

.its_my_app_work g#right-handle {
    display: none;
}

.its_my_app_work input[type=number] {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: textfield;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 1rem;
  //font-family: Arial, sans-serif;
  box-sizing: border-box;
}

.its_my_app_work input[type=number]::-webkit-inner-spin-button,
.its_my_app_work input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.its_my_app_work .tab-link.disabled {
  pointer-events: none;
  opacity: 0.5;
  cursor: default;
}





.its_my_app_work .price_inner .price {
    display: inline-flex !important;
    align-items: baseline;
    gap: 6px;
    white-space: nowrap;
    text-align: right;
}

.its_my_app_work .price_inner .price .price-tax,
.its_my_app_work .price_inner .price-tax {
    font-size: 38%;
    font-weight: 500;
    text-transform: none !important;
    white-space: nowrap;
}

.its_my_app_work .tab-content.active {
    display: block !important;
}


.its_my_app_work .spinner {
  width: 40px;
  height: 40px;
  border: 5px solid #ccc;
  border-top-color: #333;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (min-width: 1801px) and (max-width:3200px){

.its_my_app_work #tab1 .option-grid {
    grid-template-columns: repeat(3, 1fr)!important;
    margin-bottom: 3%;
}




.its_my_app_work #tab2 .card-option{
    flex-direction: column !important;
}


div#svgPreviewBox {
    text-align: center;
}

#tab5 .tabs {
    margin-bottom: 3% !important;
}

.its_my_app_work .mypreviousdesign p {
    margin-bottom: 0px !important;
}

.its_my_app_work #tab7 .form-group p {
    margin-bottom: 10%;
}

.its_my_app_work #tab7 .form-group label {
    margin-top: 10%;
}

.its_my_app_work #tab6 .card-option {
    gap: 20px;
}

}


/* === MAIN TAB ACCORDION MODE === */
.accordion-header-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.accordion-header-container .tab-link {
  width: 100%;
  border-radius: 6px;
  padding: 14px 16px;
  background: #ffb536;
  color: #000;
  cursor: pointer;
}

.accordion-header-container .tab-link.active {
  background: #ffb536;
}

/* hide number bubbles logic on mobile – accordion doesn’t need it */
@media (max-width: 768px) {
  .its_my_app_work #tabHeaderContainer .tab-link::after {
    content: none !important;
  }
}



/* Accordion plus / minus */
.accordion-header-container .tab-link {
  position: relative;
  padding-left: 40px; /* space for icon */
}

/* PLUS by default */
.accordion-header-container .tab-link::before {
  content: "+";
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  font-weight: bold;
}

/* MINUS when active */
.accordion-header-container .tab-link.active::before {
  content: "−";
}



.opening-svg-container {
    margin-right: 5px;
    width: 40%;
}

.opening-svg-container svg {
    width: 100%;
}



.its_my_app_work #tab4 .main {
    flex: unset;
    min-width: 68%;
	    margin-bottom: 5%;
}

.its_my_app_work #tab6 .main {
    flex: unset;
    min-width: 68%;
    max-width: 68%;
}

.its_my_app_work #tab6 .option-grid {
    max-width: 100%;
}

#tab6 .section-block {
    display: grid;
}



.its_my_app_work .sidebar.mypreviousdesign svg {
    margin-top: 30px;
}

div#tab7.active {
    margin-bottom: 6%;
    width: 68%;
}

.its_my_app_work #beschlag-tab .option-grid {
    max-width: 100%;
    margin-bottom: 5%;
}

.its_my_app_work .sidebar.preview-box {
    bottom: unset;
}

.its_my_app_work #tab5 .flex-2 {
    flex: unset !important;
    width: 68%;
}

.its_my_app_work #beschlag-tab .option-grid strong {
    font-size: 20px;
}

.its_my_app_work #beschlag-tab .option-grid span {
    font-size: 18px;
}

.its_my_app_work #tab6 .tab {
    padding: 5px;
}

.its_my_app_work #tab6 .main {
    flex: unset;
    min-width: 68%;
}


.its_my_app_work #tab6 .main {
    flex: unset;
    min-width: 68%;
}

span.extra_image img {
    width: 100% !important;
    text-align: center;
    height: auto !important;
}


.extra_image img.full_width_class {
    width: 100% !important;
}

<!----
.opening-svg-container {
    display: none;
}

--->




span.extra_image {
    margin-right: 10px;
}



.its_my_app_work .tab-nav-buttons{
    display:flex;
    gap:10px;
    margin-top:30px;
}

.its_my_app_work .tab-nav-buttons button{
    padding:10px 18px;
    border:1px solid #ccc;
    cursor:pointer;
}

.its_my_app_work .tab-nav-buttons button {
    background: transparent;
    color: #000;
    font-weight: bold;
    display: flex;
    flex-direction: column;
    align-items: center;
    align-content: center;
    border-radius: 20px;
	    width: 22%;

}
.its_my_app_work .tab-nav-buttons button.active{
    border: 2px solid #003087;
}

.its_my_app_work .tab-nav-buttons button img {
    width: 50%;
}


.its_my_app_work #tab3 .extra_image img {
    display: none !important;
}

div#tab3 .opening-svg-preview svg {
    width: 40%;
}



button.extrahlink a {
    display: flex !important;
    flex-direction: column !important;
    align-items: center;
}
#tab0 .tab-nav-buttons.container {
    display: grid;
    grid-auto-flow: row;
    grid-template-columns: repeat(4, 1fr)!important;
}
.its_my_app_work #tab0 .tab-nav-buttons button {
    width: 100%;
	 justify-content: flex-end !important;
    row-gap: 38px;
}
.its_my_app_work #tab0.tab-content.active {
    display: block !important;
    width: 70%;
}

.its_my_app_work #tab2 .card-option {
    flex-direction: column !important;
}

.its_my_app_work #tab2 .card-option {
    flex-direction: column !important;
    text-align: center;
	justify-content: space-between;
}

.its_my_app_work #tab3 .card-option {
    flex-direction: column !important;

}

#tab3 .opening-svg-container {
    margin-right: 5px;
    width: 60%;
}

div#tab3 .opening-svg-preview svg {
    width: 60%;
}

.its_my_app_work #tab2 .card-option .wing-svg-container svg {
    width: 50% !important;
    text-align: center;
	    height: auto;
}



<!-----unhide when client requst for hiden tiers ----->



.card-option[data-id="500"] {
    display: none !important;
}

.card-option[data-id="501"] {
    display: none !important;
}

.card-option[data-id="617"] {
    display: none !important;
}

.card-option[data-id="618"] {
    display: none !important;
}

.card-option[data-id="626"] {
    display: none !important;
}


.card-option[data-id="627"] {
    display: none !important;
}


.card-option[data-id="628"] {
    display: none !important;
}


.card-option[data-id="629"] {
    display: none !important;
}


.card-option[data-id="630"] {
    display: none !important;
}

.card-option[data-id="629"] {
    display: none !important;
}

.card-option[data-id="629"] {
    display: none !important;
}

.card-option[data-id="629"] {
    display: none !important;
}

#tab3 .opening-svg-container svg g path {
    stroke-width: 4;
}


.opening-svg-preview svg g path {
    stroke-width: 4;
}

div#svgPreviewBox svg g path {
    stroke-width: 4;
}

div#tab7-svgPreviewBox svg g path {
    stroke-width: 4;
}

.its_my_app_work #tab6 #weitere-optionen .card-option {
    display: flex;
    flex-direction: column;
}

.its_my_app_work #tab6 #weitere-optionen .card-option ul li {
    font-size: 18px;
    margin-bottom: 5px;
    margin-top: 5px;
}

.its_my_app_work #tab6 #weitere-optionen .card-option img {
    width: 60% !important;
}

.its_my_app_work #tab6 #weitere-optionen .card-option strong {
    font-size: 18px;
}

#weitere-optionen ul.feature li:nth-child(odd) {
    background: rgba(227, 227, 227, 1);
}


#tab6 .inquiry-btn,
#tab7 .inquiry-btn {
    background: #0B2D60;
    color: #fff;
    font-size: 22px;
    padding: 12px;
    margin-top: 20px;
    margin-bottom: 20px;
    font-weight: bold;
    width: 100%;
    display: block;
    border: 0;
    cursor: pointer;
}

#tab6 .inquiry-box,
#tab7 .inquiry-box {
    margin-top: 20px;
    margin-bottom: 20px;
    text-align: center;
}

.rollladen-inquiry-form {
    display: grid;
    gap: 12px;
}

.rollladen-inquiry-title {
    color: #0B2D60;
    font-size: 20px;
    font-weight: 700;
    text-align: left;
}

.rollladen-inquiry-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.rollladen-inquiry-form input,
.rollladen-inquiry-form select,
.rollladen-inquiry-form textarea {
    width: 100%;
    border: 1px solid #d5d5d5;
    padding: 10px 12px;
    font: inherit;
    box-sizing: border-box;
}

.rollladen-inquiry-form textarea {
    min-height: 180px;
    resize: vertical;
    white-space: pre-wrap;
}

.rollladen-inquiry-modal {
    position: fixed;
    inset: 0;
    z-index: 2147483647 !important;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 18px;
    box-sizing: border-box;
    overflow-y: auto;
}

.rollladen-inquiry-modal.is-open {
    display: flex;
}

.rollladen-inquiry-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 0;
}

.rollladen-inquiry-dialog {
    position: relative;
    z-index: 1;
    width: min(720px, calc(100vw - 36px));
    max-height: min(680px, calc(100dvh - 36px));
    overflow-y: auto;
    overflow-x: hidden;
    background: #fff;
    border-radius: 6px;
    padding: 22px 28px 18px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
    text-align: left;
    box-sizing: border-box;
    isolation: isolate;
}

.rollladen-inquiry-close {
    position: absolute;
    top: 14px;
    right: 16px;
    border: 0;
    background: transparent;
    color: #000;
    font-size: 26px;
    line-height: 1;
    cursor: pointer;
}

.rollladen-inquiry-logo {
    display: block;
    width: 92px;
    height: auto;
    margin-bottom: 8px;
}

.rollladen-inquiry-dialog .rollladen-inquiry-title {
    color: #2d2d2d;
    font-size: clamp(26px, 3vw, 36px);
    line-height: 1.12;
    font-weight: 700;
    margin-bottom: 16px;
}

.rollladen-inquiry-dialog .rollladen-inquiry-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 12px;
}

.rollladen-inquiry-dialog label {
    display: block;
    color: #2d2d2d;
    font-size: 15px;
    font-weight: 700;
}

.rollladen-inquiry-dialog input,
.rollladen-inquiry-dialog select,
.rollladen-inquiry-dialog textarea {
    margin-top: 6px;
    border: 1px solid #ddd;
    border-radius: 0;
    background: #fff;
    font-size: 16px;
    min-height: 40px;
}

.rollladen-inquiry-color-title {
    color: #2d2d2d;
    font-size: 15px;
    font-weight: 700;
    margin-top: 10px;
}

.rollladen-inquiry-color-help {
    color: #667085;
    font-size: 13px;
    font-weight: 600;
    margin: 4px 0 8px;
}

.rollladen-inquiry-color-area {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
    align-items: stretch;
    margin-bottom: 10px;
}

.rollladen-inquiry-color {
    min-height: 44px;
    border-radius: 999px !important;
    font-weight: 700;
    color: #2d2d2d;
    background: #fff;
}

.rollladen-inquiry-side-options {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 24px;
    margin-top: 10px;
}

.rollladen-inquiry-side-option {
    display: inline-flex !important;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 15px !important;
    font-weight: 700 !important;
}

.rollladen-inquiry-side-option input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
}

.rollladen-inquiry-side-option span {
    width: 18px;
    height: 18px;
    border: 2px solid #cfd5df;
    border-radius: 4px;
    background: #fff;
    box-sizing: border-box;
}

.rollladen-inquiry-side-option input:checked + span {
    border-color: #f5b335;
    background: #f5b335;
}

.rollladen-inquiry-preview {
    min-height: 116px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #f7f7f9;
    color: #687386;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.03em;
}

.rollladen-inquiry-preview img {
    display: block;
    max-width: 100%;
    max-height: 150px;
    width: auto;
    height: auto;
    object-fit: contain;
}

.rollladen-inquiry-dialog textarea {
    min-height: 120px;
    border-radius: 10px;
}

.rollladen-inquiry-message-label {
    display: block;
    margin-top: 2px;
}

.rollladen-inquiry-submit {
    display: block;
    margin-left: auto;
    margin-top: 0;
    border: 0;
    background: #000;
    color: #fff;
    padding: 14px 24px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
}

@media (max-width: 768px) {
    .rollladen-inquiry-dialog {
        max-height: calc(100dvh - 24px);
        padding: 18px 16px 16px;
    }

    .rollladen-inquiry-dialog .rollladen-inquiry-fields {
        grid-template-columns: 1fr;
    }

    .rollladen-inquiry-color-area {
        grid-template-columns: 1fr;
    }
}

.rollladen-sidebar-line {
    display: block;
}

#tab5 #farben-tab-innen .card-option svg {
  transition: transform 0.2s ease;
}

 #farben-tab-innen .card-option:hover svg {
  transform: scale(1.08);
}

.combo-banner {
    grid-column: 1 / -1;
}


.opening-svg-preview svg {
    height: auto !important;
    width: 60% !important;
}

#tab3 .bottom_check_point.container {
    display: none !important;
}

.balcony-door-notes {
    display: block;
    margin: 10px 0;
    padding: 8px 10px;
    border-left: 3px solid #0B2D60;
    background: #F4F4F4;
    font-size: 14px;
}

.balcony-door-notes p {
    margin: 2px 0;
}

.balcony-door-notes > span {
    display: block;
    margin: 0;
}

.optional-summary-line {
    display: block;
}

.its_my_app_work #fensterbankanschlussprofil-subtab .option-grid {
    grid-template-columns: repeat(3, minmax(250px, 1fr)) !important;
    gap: 20px !important;
    align-items: stretch;
}

.its_my_app_work #fensterbankanschlussprofil-subtab .card-option.sill-profile-option {
    display: grid !important;
    grid-template-columns: 72px minmax(0, 1fr);
    column-gap: 18px;
    row-gap: 8px;
    align-items: center;
    min-height: 158px;
    padding: 18px 38px 18px 14px;
    overflow: hidden;
}

.its_my_app_work #fensterbankanschlussprofil-subtab .sill-profile-image {
    width: 72px !important;
    max-width: 72px;
    height: auto !important;
    margin: 0 !important;
}

.its_my_app_work #fensterbankanschlussprofil-subtab .sill-profile-copy {
    min-width: 0;
}

.its_my_app_work #fensterbankanschlussprofil-subtab .sill-profile-title {
    display: block !important;
    align-items: initial !important;
    font-size: 15px !important;
    line-height: 1.28 !important;
    margin: 0 0 12px !important;
    overflow-wrap: anywhere;
    word-break: normal;
    hyphens: auto;
}

.its_my_app_work #fensterbankanschlussprofil-subtab .sill-profile-copy span {
    display: block;
    font-size: 14px !important;
    line-height: 1.55 !important;
    overflow-wrap: anywhere;
    word-break: normal;
}

@media (max-width: 820px) {
    .its_my_app_work #fensterbankanschlussprofil-subtab .option-grid {
        grid-template-columns: repeat(2, minmax(250px, 1fr)) !important;
    }
}

@media (max-width: 640px) {
    .its_my_app_work #fensterbankanschlussprofil-subtab .option-grid {
        grid-template-columns: 1fr !important;
    }

    .its_my_app_work #fensterbankanschlussprofil-subtab .card-option.sill-profile-option {
        grid-template-columns: 64px minmax(0, 1fr);
        min-height: 146px;
        padding: 16px 38px 16px 12px;
    }

    .its_my_app_work #fensterbankanschlussprofil-subtab .sill-profile-image {
        width: 64px !important;
        max-width: 64px;
    }
}

.its_my_app_work #rollladen-subtab .section-block {
    display: block !important;
    margin-bottom: 14px;
}

.its_my_app_work #rollladen-subtab .section-heading {
    margin: 0 0 10px !important;
    line-height: 1.25;
}

.its_my_app_work #rollladen-subtab .option-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
    gap: 18px !important;
    max-width: 100% !important;
    align-items: stretch;
}

.its_my_app_work #rollladen-subtab #abmessungen .option-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}

.its_my_app_work #rollladen-subtab .card-option:not(.text-input-option-block) {
    display: grid !important;
    grid-template-rows: 220px auto;
    align-items: start !important;
    gap: 12px !important;
    min-height: 388px;
    padding: 12px 38px 14px 12px !important;
    overflow: hidden;
}

.its_my_app_work #rollladen-subtab #antrieb .card-option:not(.text-input-option-block) {
    grid-template-rows: 160px auto;
    min-height: 260px;
}

.its_my_app_work #rollladen-subtab .text-input-option-block {
    padding: 10px !important;
    min-height: auto;
}

.its_my_app_work #rollladen-subtab .card-option > img {
    width: 100% !important;
    height: 220px !important;
    max-height: 220px;
    margin: 0 !important;
    object-fit: contain;
}

.its_my_app_work #rollladen-subtab #antrieb .card-option > img {
    height: 160px !important;
    max-height: 160px;
}

.its_my_app_work #rollladen-subtab .card-text {
    display: block !important;
    width: 100%;
    min-width: 0;
}

.its_my_app_work #rollladen-subtab .card-text strong {
    display: block !important;
    align-items: initial !important;
    font-size: 15px !important;
    line-height: 1.25 !important;
    margin: 0 0 6px !important;
    overflow-wrap: anywhere;
    word-break: normal;
}

.its_my_app_work #rollladen-subtab .feature {
    margin: 0;
    padding-left: 17px;
}

.its_my_app_work #rollladen-subtab .feature li {
    font-size: 13px;
    line-height: 1.35;
    margin: 2px 0;
    overflow-wrap: anywhere;
}

.its_my_app_work #rollladen-subtab .checkmark-box {
    width: 18px;
    height: 18px;
    right: 10px;
    top: 10px;
}

.its_my_app_work #rollladen-subtab .checkmark-box img {
    width: 100% !important;
    height: auto !important;
    margin: 0 !important;
}

@media (max-width: 820px) {
    .its_my_app_work #rollladen-subtab .option-grid,
    .its_my_app_work #rollladen-subtab #abmessungen .option-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
}

@media (max-width: 640px) {
    .its_my_app_work #rollladen-subtab .option-grid,
    .its_my_app_work #rollladen-subtab #abmessungen .option-grid {
        grid-template-columns: 1fr !important;
    }

    .its_my_app_work #rollladen-subtab .card-option:not(.text-input-option-block) {
        grid-template-rows: 180px auto;
        min-height: auto;
    }

    .its_my_app_work #rollladen-subtab .card-option > img {
        height: 180px !important;
        max-height: 180px;
    }

    .its_my_app_work #rollladen-subtab #antrieb .card-option > img {
        height: 140px !important;
        max-height: 140px;
    }
}

.its_my_app_work #rollladen-subtab .rollladen-reference {
    max-width: 100%;
}

.its_my_app_work #rollladen-subtab .rollladen-reference-intro {
    margin-bottom: 22px;
}

.its_my_app_work #rollladen-subtab .rollladen-reference h3 {
    margin: 0 0 18px;
    font-size: 34px;
    line-height: 1.15;
    font-weight: 500;
    color: #000;
}

.its_my_app_work #rollladen-subtab .rollladen-reference-intro p {
    margin: 0 0 16px;
    font-size: 20px;
    font-weight: 600;
    color: #000;
}

.its_my_app_work #rollladen-subtab .rollladen-request-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 20px;
}

.its_my_app_work #rollladen-subtab .rollladen-request-heading strong {
    font-size: 28px;
    line-height: 1.2;
}

.its_my_app_work #rollladen-subtab .rollladen-choice {
    appearance: none;
    border: 0;
    background: transparent;
    padding: 0;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font: inherit;
    color: #111;
    cursor: pointer;
    text-align: left;
}

.its_my_app_work #rollladen-subtab .rollladen-checkbox {
    width: 28px;
    height: 28px;
    border: 2px solid #c5c5c5;
    border-radius: 6px;
    background: #fff;
    box-shadow: inset 0 0 0 3px #fff;
    flex: 0 0 auto;
}

.its_my_app_work #rollladen-subtab .rollladen-choice.active .rollladen-checkbox,
.its_my_app_work #rollladen-subtab .rollladen-mounting-choice.active .rollladen-checkbox {
    background: #3f9b2a;
}

.its_my_app_work #rollladen-subtab .rollladen-system-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 22px;
    margin-bottom: 34px;
}

.its_my_app_work #rollladen-subtab .rollladen-reference-card {
    border: 1px solid #cfcfcf;
    background: #fff;
    min-height: 430px;
    padding: 24px 26px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    cursor: pointer;
}

.its_my_app_work #rollladen-subtab .rollladen-reference-card.active {
    border-color: #0B2D60;
    box-shadow: inset 0 0 0 1px #0B2D60;
}

.its_my_app_work #rollladen-subtab .rollladen-system-image {
    width: 100% !important;
    height: 280px !important;
    object-fit: contain;
    margin: 0 0 20px !important;
}

.its_my_app_work #rollladen-subtab .rollladen-system-title {
    display: block;
    font-size: 22px;
    line-height: 1.2;
    font-weight: 500;
    color: #111;
    text-align: center;
    margin-bottom: 12px;
}

.its_my_app_work #rollladen-subtab .rollladen-mounting-list {
    display: grid;
    gap: 10px;
}

.its_my_app_work #rollladen-subtab .rollladen-mounting-choice {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    line-height: 1.2;
    color: #111;
    cursor: pointer;
}

.its_my_app_work #rollladen-subtab .rollladen-drive-section {
    margin-top: 24px;
}

.its_my_app_work #rollladen-subtab .rollladen-drive-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(140px, 1fr));
    gap: 32px;
    margin: 22px 0 14px;
}

.its_my_app_work #rollladen-subtab .rollladen-drive-choice {
    font-size: 20px;
}

.its_my_app_work #rollladen-subtab .rollladen-choice-note {
    margin: 0;
    color: #777;
    font-size: 18px;
    font-style: italic;
    font-weight: 600;
    text-align: right;
}

@media (max-width: 820px) {
    .its_my_app_work #rollladen-subtab .rollladen-reference h3 {
        font-size: 28px;
    }

    .its_my_app_work #rollladen-subtab .rollladen-system-grid,
    .its_my_app_work #rollladen-subtab .rollladen-drive-row {
        grid-template-columns: 1fr;
    }

    .its_my_app_work #rollladen-subtab .rollladen-reference-card {
        min-height: auto;
    }
}

.its_my_app_work #tab2 .wing-svg-container,
.its_my_app_work #tab3 .opening-svg-container {
    width: 100%;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 0 18px;
}

.its_my_app_work #tab2 .card-option .wing-svg-container svg,
.its_my_app_work #tab2 .card-option .wing-svg-container svg:first-child,
.its_my_app_work #tab3 .card-option .opening-svg-container svg {
    width: auto !important;
    height: 210px !important;
    max-width: 100%;
    margin: 0 auto !important;
    display: block;
}

.its_my_app_work #tab2 .card-option[data-id="16"] .wing-svg-container {
    overflow: visible;
}

.its_my_app_work #tab2 .card-option[data-id="16"] .wing-svg-container svg {
    transform: scaleY(1.45);
    transform-origin: center center;
}

.its_my_app_work #tab5 .option-grid.tab5-isolierglas-grid {
    grid-template-columns: repeat(2, minmax(280px, 1fr)) !important;
    gap: 24px;
}

@media (max-width: 768px) {
    .its_my_app_work #tab2 .wing-svg-container,
    .its_my_app_work #tab3 .opening-svg-container {
        height: 160px;
    }

    .its_my_app_work #tab2 .card-option .wing-svg-container svg,
    .its_my_app_work #tab2 .card-option .wing-svg-container svg:first-child,
    .its_my_app_work #tab3 .card-option .opening-svg-container svg {
        height: 150px !important;
    }

    .its_my_app_work #tab2 .card-option[data-id="16"] .wing-svg-container svg {
        transform: scaleY(1.35);
    }

    .its_my_app_work #tab5 .option-grid.tab5-isolierglas-grid {
        grid-template-columns: 1fr !important;
    }
}

/* Keep Tab 5 footer controls out of the right-hand preview column. */
@media (min-width: 1024px) {
    .its_my_app_work #tab5.active > .bottom_check_point.container,
    div#globalBottomCheckpoint[data-active-tab="tab5"] > .bottom_check_point.container {
        display: block !important;
        width: 58% !important;
        max-width: 58% !important;
        min-width: 0 !important;
        margin-left: 20px !important;
        margin-right: auto !important;
        padding: 0 !important;
        box-sizing: border-box;
    }

    div#globalBottomCheckpoint[data-active-tab="tab5"] {
        pointer-events: none;
    }

    div#globalBottomCheckpoint[data-active-tab="tab5"] > .bottom_check_point.container {
        pointer-events: auto;
    }

    .its_my_app_work #tab4.active .preview-box,
    .its_my_app_work #tab5.active .preview-box,
    .its_my_app_work #tab6.active .preview-box,
    .its_my_app_work #tab7.active .preview-box {
        max-height: calc(100vh - 140px);
        overflow-y: auto;
        box-sizing: border-box;
    }
}

.rollladen-inquiry-modal {
    z-index: 2147483647 !important;
    overflow-y: auto;
}

.rollladen-inquiry-dialog {
    z-index: 1000000000 !important;
    max-height: min(680px, calc(100dvh - 36px));
}

/* Doc QA fixes: keep summary text consistent and avoid image/card overlaps. */
.balcony-door-notes {
    display: block;
    margin: 2px 0;
    padding: 0;
    border-left: 0;
    background: transparent;
    color: inherit;
    font-size: inherit;
    line-height: inherit;
    font-weight: 400;
}

.balcony-door-notes p {
    margin: 0;
    color: inherit;
    font-size: inherit;
    line-height: inherit;
    font-weight: 400;
}

.balcony-door-notes > span {
    display: block;
    margin: 0;
    color: inherit;
    font-size: inherit;
    line-height: inherit;
    font-weight: 400;
}

.its_my_app_work .preview-box .forscrolling,
.its_my_app_work .preview-box .summary-box {
    font-size: 15px;
    line-height: 1.42;
    color: #222;
    font-weight: 400;
}

.its_my_app_work .rollladen-sidebar-line {
    display: block;
    font-size: inherit;
    line-height: inherit;
    color: inherit;
    font-weight: 400;
}

.its_my_app_work .preview-box .preview-cart-button {
    margin: 16px 0 0;
    min-height: 44px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0;
}

.its_my_app_work .preview-box .price-box {
    margin: 10px 0 14px;
    padding: 12px 0;
    background: transparent;
    border-top: 1px solid rgba(11, 45, 96, 0.14);
    border-bottom: 1px solid rgba(11, 45, 96, 0.14);
}

.its_my_app_work .preview-box .price_inner strong {
    margin-top: 0;
    margin-bottom: 8px;
    align-items: flex-start;
    gap: 12px;
    font-size: 15px;
    line-height: 1.25;
    letter-spacing: 0;
}

.its_my_app_work .preview-box .price_inner .price {
    font-size: 22px;
    line-height: 1.1;
    font-weight: 700;
}

.its_my_app_work .preview-box .price_inner .price-tax {
    font-size: 10px !important;
    line-height: 1.2;
    color: #333;
    white-space: nowrap;
}

.its_my_app_work .preview-box .price-box > span {
    display: block;
    margin-bottom: 10px;
    font-size: 13px;
    line-height: 1.35;
    color: #333;
    text-transform: uppercase;
}

.its_my_app_work .preview-box .price_inner p {
    margin: 0 0 10px;
    font-size: 13px !important;
    line-height: 1.35;
    color: #333;
    text-transform: uppercase;
}

.its_my_app_work .preview-box .quantity_app {
    margin-top: 6px;
    font-size: 16px;
    line-height: 1.2;
    color: #222;
}

.its_my_app_work .preview-box .quantity_app label,
.its_my_app_work .preview-box .quantity_app > span:first-child {
    font-size: 16px;
    line-height: 1.2;
    color: #333;
}

.its_my_app_work .preview-box span.quantity_cover {
    background: transparent;
    border: 1px solid rgba(11, 45, 96, 0.18);
    padding: 4px 8px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
}

.its_my_app_work .preview-box span.quantity_cover button {
    padding: 0 10px;
    font-size: 20px;
    line-height: 1;
}

@media (min-width: 1024px) {
    .its_my_app_work #tab4.active .preview-box,
    .its_my_app_work #tab5.active .preview-box,
    .its_my_app_work #tab6.active .preview-box,
    .its_my_app_work #tab7.active .preview-box {
        max-height: calc(100vh - 110px);
        padding: 22px 22px 24px;
        background: #f5f5f6;
        overflow-y: auto;
        scrollbar-gutter: stable;
    }
}

.its_my_app_work .preview-box .forscrolling {
    display: flex;
    flex-direction: column;
    min-height: 0;
    gap: 10px;
}

.its_my_app_work .preview-box h4 {
    margin: 0;
    color: #1f2933;
    font-size: 12px;
    line-height: 1.2;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
}

.its_my_app_work .preview-box .svgover,
.its_my_app_work #tab7-svgPreviewBox {
    display: flex;
    align-items: center;
    justify-content: center;
    max-height: 230px;
    min-height: 150px;
    overflow: hidden;
    border-bottom: 1px solid rgba(11, 45, 96, 0.08);
    padding-bottom: 8px;
}

.its_my_app_work .preview-box .svgover svg,
.its_my_app_work #tab7-svgPreviewBox svg {
    max-width: 100% !important;
    max-height: 220px !important;
}

.its_my_app_work .preview-box .summary-box {
    margin-top: 0 !important;
    padding-top: 2px;
    color: #242424;
    font-size: 14px !important;
    line-height: 1.38;
    font-weight: 400;
    text-align: left;
    text-transform: none;
    overflow-wrap: anywhere;
}

.its_my_app_work .preview-box .summary-box strong {
    display: block;
    margin: 0 0 8px;
    color: #111;
    font-size: 16px !important;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: uppercase;
}

.its_my_app_work .preview-box .summary-box strong span {
    font-size: inherit !important;
    line-height: inherit !important;
    font-weight: inherit !important;
}

.its_my_app_work .preview-box .summary-box,
.its_my_app_work .preview-box .summary-box span,
.its_my_app_work .preview-box .summary-box div,
.its_my_app_work .preview-box .summary-box p,
.its_my_app_work .preview-box .rollladen-sidebar-line {
    font-size: 14px !important;
    line-height: 1.38 !important;
    letter-spacing: 0 !important;
}

.its_my_app_work .preview-box .summary-box > span,
.its_my_app_work .preview-box .summary-box > div:not(.balcony-door-notes):not(#t7-sidebar-rollladen):not(#zubehoer-sidebar-rollladen),
.its_my_app_work .preview-box .summary-box p {
    margin-bottom: 2px;
}

.its_my_app_work .preview-box .summary-box > span[id$="-wing"],
.its_my_app_work .preview-box .summary-box > span[id$="-opening"],
.its_my_app_work .preview-box .summary-box #t7-sidebar-wing,
.its_my_app_work .preview-box .summary-box #t7-sidebar-opening {
    font-size: 15px !important;
    line-height: 1.28 !important;
    font-weight: 500;
}

.its_my_app_work .preview-box .summary-box #t7-sidebar-rollladen,
.its_my_app_work .preview-box .summary-box #zubehoer-sidebar-rollladen {
    margin-top: 8px;
}

.its_my_app_work .preview-box .summary-box p {
    margin: 0 0 3px;
    color: inherit;
    font: inherit;
    line-height: inherit;
}

.its_my_app_work .preview-box .price-box {
    order: 2;
    margin: 0;
    padding: 10px 0 12px;
}

.its_my_app_work .preview-box .summary-box {
    order: 3;
}

.its_my_app_work .preview-box .preview-cart-button {
    position: sticky;
    bottom: 0;
    z-index: 5;
    order: 4;
    margin-top: 10px;
    box-shadow: 0 -8px 14px rgba(245, 245, 246, 0.92);
}

.its_my_app_work .preview-box .preview-cart-button.is-inquiry-button {
    background: #0b2d60;
}

.its_my_app_work .preview-box .price_inner strong {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    width: 100%;
}

.its_my_app_work .preview-box .quantity_app {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.its_my_app_work #tab5 .option-grid.tab5-ornament-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
    gap: 16px !important;
    margin-top: 0 !important;
    align-items: stretch;
}

.its_my_app_work #tab5 .option-grid.tab5-ornament-grid .card-option {
    min-height: 210px;
    padding: 14px !important;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}

.its_my_app_work #tab5 .option-grid.tab5-ornament-grid .card-option > img {
    width: 100% !important;
    max-width: 190px !important;
    height: 132px !important;
    max-height: 132px !important;
    object-fit: contain;
    margin: 0 0 10px !important;
    transform: none !important;
}

.its_my_app_work #tab5 .option-grid.tab5-ornament-grid .card-option[data-id="__klarglas__"] > img {
    max-width: 220px !important;
    height: 145px !important;
    max-height: 145px !important;
}

.its_my_app_work #tab5 .option-grid.tab5-ornament-grid .card-option .checkmark-box img {
    width: 100% !important;
    max-width: 18px !important;
    height: auto !important;
    max-height: 18px !important;
    margin: 0 !important;
}

.its_my_app_work #fensterbankanschlussprofil-subtab .card-option.sill-profile-option {
    grid-template-columns: 118px minmax(0, 1fr);
    min-height: 172px;
}

.its_my_app_work #fensterbankanschlussprofil-subtab .sill-profile-image {
    width: 112px !important;
    max-width: 112px;
}

@media (max-width: 640px) {
    .its_my_app_work #fensterbankanschlussprofil-subtab .card-option.sill-profile-option {
        grid-template-columns: 96px minmax(0, 1fr);
    }

    .its_my_app_work #fensterbankanschlussprofil-subtab .sill-profile-image {
        width: 92px !important;
        max-width: 92px;
    }
}




</style>
</head>
<body>
<div class="its_my_app_work">
<div class="its_loading" style="position:relative";>
<div id="tabLoader" style="
  position: absolute;  /* full overlay */
  top: 0; left: 0; right: 0; bottom: 0;
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5em;
  color: #333;
  user-select: none;
  z-index: 9999;
">
 <div class="spinner"></div><span class="loading_content">Laden…</span>
</div>

<div class="for_fix_sidebar">

<div class="tab-nav-buttons container">
  <button data-code="__static_ksf__" class="active" onclick="goToTabWithCode('__static_ksf__')">

  <img src="https://cdn.shopify.com/s/files/1/0987/9683/1102/files/Kunststofffenster-Konfigurator.webp?v=1773949803">
  <span>Fenster</span></button>

  <button data-code="__static_balkon__" onclick="goToTabWithCode('__static_balkon__')">
    <img src="https://cdn.shopify.com/s/files/1/0987/9683/1102/files/Balkontuer-Konfigurator.webp?v=1773949803">
  <span>Balkontüren</span></button>

  <button  data-code="__static_schiebe__" onclick="goToTabWithCode('__static_schiebe__')">
<img src="https://cdn.shopify.com/s/files/1/0987/9683/1102/files/Hebeschiebetuer-Konfigurator.webp?v=1773949802">
  <span>Schiebetüren</span></button>

  <button class="extrahlink">
   <a  data-code="__haustüren__" href="https://deine-fenster24.myshopify.com/collections/turen">
<img src="https://cdn.shopify.com/s/files/1/0987/9683/1102/files/WhatsApp_Image_2026-05-12_at_1.43.53_AM.png?v=1778531034">
  <span>Haustüren</span></a>
  </button>

  </div>



<div class="tab-header-wrapper">
  <div class="tab-header accordion-header-container container" id="tabHeaderContainer">

  </div>


</div>

<div class="fixed_sidebar_inner">

  <!-- TAB 1 -->
  <div class="tab-content" id="tab1">
    <h2>1. PROFIL AUSWÄHLEN</h2>
	<div class="container">
      <div class="option-grid">

      </div>
      <div class="sidebar preview-box" data-preview="profile">
	    <div class="inner_scrolling">

        <h4>INNENANSICHT</h4>
      <img src="" alt="Profile Image" />
  <p></p>
      </div>
	  </div>
    </div>
<div class="bottom_check_point container">
    <div class="progress-bar-container">
      <div class="progress-bar" id="progressBar"></div>
    </div>

    <div class="footer-buttons">
      <button class="btnmain">BEENDEN</button>
      <button class="btnmain next_butoon" onclick="nextTab()">WEITER</button>
    </div>
	</div>
  </div>

  <!-- TAB 2 -->
  <div class="tab-content" id="tab2">
    <h2>2. FLÜGEL KONFIGURIEREN</h2>
	<div class="container">
      <div class="option-grid">

      </div>
     <div class="preview-box" data-preview="wing">

  <h4>INNENANSICHT</h4>
  <div class="wing-svg-preview"></div>
  <img src="" alt="Preview" style="display:none;">
  <p></p>

</div>
    </div>
<div class="bottom_check_point container">
    <div class="progress-bar-container">
      <div class="progress-bar" id="progressBar"></div>
    </div>

    <div class="footer-buttons">
      <button class="btnmain" onclick="prevTab()">ZURÜCK</button>
      <button class="btnmain next_butoon" onclick="nextTab()">WEITER</button>
    </div>
	</div>
  </div>

  <!-- TAB 3 -->
  <div class="tab-content" id="tab3">
    <h2>3. ÖFFNUNGSART AUSWÄHLEN</h2>
    <div class="container">
      <div class="option-grid">
      </div>
      <div class="preview-box" data-preview="opening">

  <h4>ÖFFNUNGSART</h4>
  <div class="opening-svg-preview"></div>
  <img src="" alt="Preview" style="display:none;"><p></p>

</div>

    </div>
<div class="bottom_check_point container">
    <div class="progress-bar-container">
      <div class="progress-bar" id="progressBar"></div>
    </div>

    <div class="footer-buttons">
      <button class="btnmain" onclick="prevTab()">ZURÜCK</button>
      <button class="btnmain next_butoon next" onclick="nextTab()">WEITER</button>
    </div>
	</div>
  </div>

   <!-- Tab 4: Abmessung + Beschläge -->
  <div class="tab-content" id="tab4">
    <h2>4. ABMESSUNG UND BESCHLÄGE</h2>
    <div class="container">
      <!-- Main part -->
      <div class="main">
        <!-- Tab 4 sub-tabs -->
        <div class="tabs">
          <div class="tab active" onclick="switchSubTab('groesse')">GRÖSSE</div>
          <div class="tab" onclick="switchSubTab('beschlag')">BESCHLAG</div>
        </div>
        <div id="groesse-tab">

<div class="section-title">GRÖSSE</div>

          <div class="flex-row">
            <div class="form-group">
              <label for="width">BREITE (MM)</label>
<input id="width" type="number" min="400" max="2000" id="w" step="1" style="/* add your dropdown styles here if needed */" />
            </div>
            <div class="form-group">
              <label for="height">HÖHE (MM)</label>
            <input id="height" type="number" min="400" max="2000" id="h" step="1" style="/* add your dropdown styles here if needed */" />
            </div>
          </div>
          <div id="elemets_group">

                      </div>
        </div>
        <div id="beschlag-tab" style="display: none;">
          <div class="section-title">BESCHLAG</div>
          <div class="option-grid">
            <div class="card-option active" onclick="selectBeschlag(this,'SIEGENIA FAVORIT BASIS')">
              <img src="https://droplify.de/deine-fenster24/frontend/Beschlag1.png">
              <div>
                <strong>SIEGENIA FAVORIT BASIS</strong><br><span>Sichtbar</span>
              </div>
              <span class="checkmark-box">
                <img src="https://droplify.de/deine-fenster24/frontend/Vector.svg">
              </span>
            </div>
            <div class="card-option" onclick="selectBeschlag(this,'SIEGENIA FAVORIT BASIS')">
              <img src="https://droplify.de/deine-fenster24/frontend/Beschlag2.png">
              <div>
                <strong>SIEGENIA FAVORIT BASIS</strong><br><span>Sichtbar</span>
              </div>
              <span class="checkmark-box">
                <img src="https://droplify.de/deine-fenster24/frontend/Vector.svg">
              </span>
            </div>
            <div class="card-option" onclick="selectBeschlag(this,'SIEGENIA TITAN WK2/RC2N')">
              <img src="https://droplify.de/deine-fenster24/frontend/Beschlag3.png">
              <div>
                <strong>SIEGENIA TITAN WK2/RC2N</strong><br><span>Siegenia Titan WK2/RC2N</span>
              </div>
              <span class="checkmark-box">
                <img src="https://droplify.de/deine-fenster24/frontend/Vector.svg">
              </span>
            </div>
          </div>
        </div>
      </div>
      <!-- Sidebar -->
      <div class="sidebar preview-box">
	  <div class="forscrolling">
        <h4>INNENANSICHT</h4>

	<div class="svgover" id="svgPreviewBox">
	</div>

	        <div class="price-box">
	<div class="price_inner">
		          <strong>FENSTER  <span class="price" id="tab4-price">54.96 € <span class="price-tax">inkl. MwSt. zzg. Versand</span></span></strong>

</div>
          <span>Lieferzeit: ca. 3-5 Wochen</span>
          <div class="quantity quantity_app">
            <label for="qty">Menge:</label>
<span class="quantity_cover">
            <button onclick="adjustQty(-1)">−</button>
            <span id="qty">1</span>
            <button onclick="adjustQty(1)">+</button>
	</span>
	          </div>
	        </div>
	        <div class="summary-box">
	<p></p>
	          <strong><span id="sb-profile">IGLO 5 CLASSIC</span></strong><br>
	          <span id="sb-wing">3-TLG. ELEMENT MIT 3 FELDER NEBENEINANDER</span><br>
	          <span id="sb-opening">FESTVERGLASUNG</span><br>
	          Breite: <span id="sb-width">500</span> mm<br>
	          Höhe: <span id="sb-height">557</span> mm<br>
	          Beschlag: <span id="sb-beschlag">SIEGENIA FAVORIT BASIS</span><br>
	          Dichtungen schwarz
	        </div>
          <button class="btnmain-cart cart preview-cart-button">🛒 ZUM WARENKORB HINZUFÜGEN</button>
	      </div>
	     </div>
	    </div>

	<div class="bottom_check_point container">
 <div class="progress-bar-container"><div class="progress-bar"></div></div>
      <div class="footer-buttons">
        <button class="btnmain back" onclick="prevTab()">ZURÜCK</button>
        <button class="btnmain next_butoon next" onclick="nextTab()">WEITER</button>
      </div>

	  </div>
  </div>



 <!-- TAB 5: Farben und Glass (FULL HTML, no skipped content) -->
<div class="tab-content" id="tab5">
  <h2>5. FARBEN UND GLASS</h2>
  <div class="container">
    <div class="flex-2" style="flex:2">
      <!-- Sub-tabs -->
      <div class="tabs" style="margin-bottom:18px;">
        <div class="tab active" onclick="switchGlassSubTab('innen')">FARBE INNEN</div>
        <div class="tab" onclick="switchGlassSubTab('aussen')">FARBE AUSSEN</div>
        <div class="tab" onclick="switchGlassSubTab('griff')">GRIFF</div>
        <div class="tab" onclick="switchGlassSubTab('isolierglas')">ISOLIERGLAS</div>
        <div class="tab" onclick="switchGlassSubTab('ornament')">ORNAMENT</div>
		 <div id="VSG_Glas" class="tab" onclick="switchGlassSubTab('VSGGlas')">VSG Glas</div>
      </div>
      <!-- Innenfarbe -->
      <div id="farben-tab-innen" class="option-grid glass-subtab active">
<div class="section-title">FARBE INNEN</div>
</div>


      <!-- Aussenfarbe -->
      <div id="farben-tab-aussen" class="option-grid glass-subtab" style="display:none;">
<div class="section-title">FARBE AUSSEN</div>
      </div>

      <!-- Griff -->
      <div id="farben-tab-griff" class="option-grid glass-subtab" style="display:none;">
<div class="section-title">GRIFF</div>

      </div>
      <!-- Isolierglas -->
      <div id="farben-tab-isolierglas" class="option-grid glass-subtab" style="display:none;">

<div class="section-title">ISOLIERGLAS</div>

            </div>
      <!-- Ornament -->
      <div id="farben-tab-ornament" class="option-grid glass-subtab" style="display:none;">

<div class="section-title">ORNAMENT</div>
      </div>

	   <div id="farben-tab-vsg" class="option-grid glass-subtab" style="display:none;">

<div class="section-title">VSG Glas</div>
      </div>

    </div>
   <!-- Sidebar preview (Tab 5, ALL data carried over, unique IDs, always updates) -->


<div class="sidebar preview-box" id="glass-sidebar">
<div class="forscrolling">
	  <h4>INNENANSICHT</h4>
	 <div class="svgover" id="svgPreviewBox">
	</div>

	  <div class="price-box">
	  <div class="price_inner">
		    <strong>FENSTER <span class="price" id="glass-price">65.96 € <span class="price-tax">inkl. MwSt. zzg. Versand</span></span></strong>
    </div>
    <span>Lieferzeit: ca. 3-5 Wochen</span>
    <div class="quantity quantity_app">
      <label for="glass-qty">Menge:</label>
   <span class="quantity_cover">
  <button onclick="adjustQty(-1)">−</button>
  <span id="qty">1</span>
  <button onclick="adjustQty(1)">+</button>
	</span>
	    </div>
	  </div>
	<p></p>
	  <div class="summary-box">
	    <strong><span id="glass-sidebar-profile">IGLO 5 CLASSIC</span></strong><br>
	    <span id="glass-sidebar-wing">3-TLG. ELEMENT MIT 3 FELDER NEBENEINANDER</span><br>
	    <span id="glass-sidebar-opening">FESTVERGLASUNG</span><br>
	    Breite: <span id="glass-sidebar-width">500</span> mm<br>
		    Höhe: <span id="glass-sidebar-height">557</span> mm<br>
		    <span id="glass-sidebar-balkon-notes"></span>
		    Beschlag: <span id="glass-sidebar-beschlag">SIEGENIA FAVORIT BASIS</span><br>
		    Farbe innen: <span id="glass-sidebar-innen">BETONGRAU</span><br>
		    Farbe außen: <span id="glass-sidebar-aussen">Weiss</span><br>
		    Griff: <span id="glass-sidebar-griff">Standard weiss</span><br>
		    Isolierglas: <span id="glass-sidebar-isolierglas">2-fach Verglasung</span><br>
		    Ornament: <span id="glass-sidebar-ornament">Klarglas</span><br>
		    Dichtungen schwarz<br>
			<span class="optional-summary-line" style="display:none;">VSG Glas: <span id="glass-sidebar-vsg"></span></span>
		  </div>
    <button class="btnmain-cart cart preview-cart-button">🛒 ZUM WARENKORB HINZUFÜGEN</button>
	</div>
	</div>
	  </div>

  <div class="bottom_check_point container">
 <div class="progress-bar-container"><div class="progress-bar"></div></div>
      <div class="footer-buttons">
        <button class="btnmain back" onclick="prevTab()">ZURÜCK</button>
        <button class="btnmain next_butoon next" onclick="nextTab()">WEITER</button>
      </div>

	  </div>
</div>




<!-- TAB 6: ZUBEHÖR -->
<div class="tab-content" id="tab6">
  <h2 style="margin-bottom:1.5rem;">6. ZUBEHÖR</h2>
  <div class="container">
    <!-- Left main grid -->
    <div class="main">
      <!-- Sub-tabs for Zubehör -->
      <div class="tabs" style="margin-bottom:18px;">
        <div class="tab active">RAHMENVERBREITERUNG</div>
        <div class="tab">FENSTERBANK-ANSCHLUSSPROFIL</div>
        <div class="tab">ROLLLADEN</div>
        <div class="tab" style="display:none"></div>
      </div>
      <!-- Rahmenverbreiterung subtab -->
      <div id="rahmenverbreiterung-subtab" class="accessory-subtab" style="">
        <div class="section-title">RAHMENVERBREITERUNG</div>

		 <div style="display:flex;flex-wrap:wrap;gap:2rem;">

        <div class="form-group">
            <label for="rb-oben">RAHMENVERBREITERUNG OBEN</label>
      <select id="rb-oben"></select>
    </div>

        <div class="form-group">
            <label for="rb-rechts">RAHMENVERBREITERUNG RECHTS</label>
      <select id="rb-rechts"></select>
    </div>

  <div class="form-group">
            <label for="rb-unten">RAHMENVERBREITERUNG UNTEN</label>
      <select id="rb-unten"></select>
    </div>

<div class="form-group">
            <label for="rb-links">RAHMENVERBREITERUNG LINKS</label>
      <select id="rb-links"></select>
    </div>

  </div>


		<!----
        <div style="display:flex;flex-wrap:wrap;gap:2rem;">
          <div class="form-group">
            <label for="rb-oben">RAHMENVERBREITERUNG OBEN</label>
            <select id="rb-oben">
              <option>15MM</option>
              <option>30MM</option>
              <option>50MM</option>
            </select>
          </div>
          <div class="form-group">
            <label for="rb-rechts">RAHMENVERBREITERUNG RECHTS</label>
            <select id="rb-rechts">
              <option>15MM</option>
              <option>30MM</option>
              <option>50MM</option>
            </select>
          </div>
          <div class="form-group">
            <label for="rb-unten">RAHMENVERBREITERUNG UNTEN</label>
            <select id="rb-unten">
              <option>15MM</option>
              <option>30MM</option>
              <option>50MM</option>
            </select>
          </div>
          <div class="form-group">
            <label for="rb-links">RAHMENVERBREITERUNG LINKS</label>
            <select id="rb-links">
              <option>15MM</option>
              <option>30MM</option>
              <option>50MM</option>
            </select>
          </div>
        </div>
		----->
      </div>
      <!-- Fensterbank-Anschlussprofil subtab -->
      <div id="fensterbankanschlussprofil-subtab" class="accessory-subtab" style="display:none;">
        <div class="section-title">FENSTERBANK-ANSCHLUSSPROFIL</div>
        <div class="option-grid"></div>
      </div>
      <!-- Rolladen subtab -->
      <div id="rollladen-subtab" class="accessory-subtab" style="display:none;">
        <div class="section-title">ROLLLADEN</div>
        <div class="option-grid">



        </div>
      </div>
    </div>
    <!-- Sidebar (right) -->
    <div class="sidebar mypreviousdesign preview-box">
	<div class="forscrolling">
	      <h4>INNENANSICHT</h4>
		     <div class="svgover" id="svgPreviewBox">
		    </div>

		      <div class="price-box">
	      <div class="price_inner">
	        <strong>FENSTER
	        <span class="price" id="zubehoer-price">54.96 € <span class="price-tax">inkl. MwSt. zzg. Versand</span></span></strong>
        </div>

        <span>Lieferzeit: ca. 3-5 Wochen</span>
        <div class="quantity quantity_app">
          <label>Menge:</label>
          <span class="quantity_cover">
  <button onclick="adjustQty(-1)">−</button>
  <span id="qty">1</span>
  <button onclick="adjustQty(1)">+</button>
	</span>
	        </div>
	      </div>
			      <div class="summary-box">
        <strong><span id="zubehoer-sidebar-profile"></span></strong><br>
        <span id="zubehoer-sidebar-wing"></span><br>
		        <span id="zubehoer-sidebar-opening"></span><br>
		        Breite: <span id="zubehoer-sidebar-width"></span> mm<br>
		        Höhe: <span id="zubehoer-sidebar-height"></span> mm<br>
		        <span id="zubehoer-sidebar-balkon-notes"></span>
		        Beschlag: <span id="zubehoer-sidebar-beschlag"></span><br>
	        Farbe innen: <span id="zubehoer-sidebar-innen"></span><br>
	        Farbe außen: <span id="zubehoer-sidebar-aussen"></span><br>
	        Griff: <span id="zubehoer-sidebar-griff"></span><br>
		        Isolierglas: <span id="zubehoer-sidebar-isolierglas"></span><br>
		        Ornament: <span id="zubehoer-sidebar-ornament"></span><br>
		        Dichtungen schwarz<br>
		        <span class="optional-summary-line" style="display:none;">VSG Glas: <span id="zubehoer-sidebar-vsg"></span></span>
		       Rahmen: <span id="zubehoer-sidebar-rahmen"></span><br>
	       Fensterbank-Anschlussprofil: <span id="zubehoer-sidebar-fensterbank"></span><br>
	       <span id="zubehoer-sidebar-luefter" style="display:none"></span>
	        <span id="zubehoer-sidebar-reedkontakt" style="display:none"></span>
	       <span id="zubehoer-sidebar-rollladen"></span>

	      </div>
        <button class="btnmain-cart cart preview-cart-button">🛒 ZUM WARENKORB HINZUFÜGEN</button>
	    </div>
	  <div>
	</div>

</div>



<div id="tab7" class="tab-content">
  <h2>7. ÜBERPRÜFEN UND BESTELLEN</h2>
  <div class="container">
    <!-- Left: Summary Details -->
    <div class="main">
      <div class="flex-row">
        <div class="form-group"><label>System</label><p id="t7-system"></p></div>
        <div class="form-group"><label>Typ</label><p id="t7-typ"></p></div>
        <div class="form-group"><label>Öffnungsart</label><p id="t7-opening"></p></div>
      </div>

      <div class="flex-row">
        <div class="form-group"><label>Breite</label><p id="t7-width"></p></div>
        <div class="form-group"><label>Höhe</label><p id="t7-height"></p></div>
        <div class="form-group"><label>Beschlag</label><p id="t7-beschlag"></p></div>
      </div>

      <div class="flex-row">
        <div class="form-group"><label>Farbe Innen</label><p id="t7-innen"></p></div>
        <div class="form-group"><label>Farbe Außen</label><p id="t7-aussen"></p></div>
        <div class="form-group"><label>Griff</label><p id="t7-griff"></p></div>
      </div>

	      <div class="flex-row">
	        <div class="form-group"><label>Isolierglas</label><p id="t7-isolierglas"></p></div>
	        <div class="form-group"><label>Ornament</label><p id="t7-ornament"></p></div>
	      </div>
	      <div class="flex-row">
	        <div class="form-group optional-summary-field" style="display:none;"><label>Rahmenverbreiterung</label><p id="t7-rahmen"></p></div>
	        <div class="form-group optional-summary-field" style="display:none;"><label>Fensterbank-Anschlussprofil</label><p id="t7-fensterbank"></p></div>
	        <div class="form-group optional-summary-field" style="display:none;"><label>Rollläden</label><p id="t7-rollladen-summary"></p></div>
	      </div>
	    </div>


    <!-- Right Sidebar (Preview Box reused layout) -->
    <div class="sidebar mypreviousdesign preview-box">
	<div class="forscrolling">
      <h4>Innenansicht</h4>
	     <div id="tab7-svgPreviewBox"></div>

      <div class="price-box">
        <div class="price_inner">
          <strong>Fenster <span class="price"  id="t7-price">—</span></strong>
          <p>Lieferzeit: ca. 3-5 Wochen</p>
        </div>

        <div class="quantity_app">
          <span>Menge</span>
          <span class="quantity_cover">
    <button onclick="adjustQty(-1)">−</button>
    <span id="qty">1</span>
    <button onclick="adjustQty(1)">+</button>
  </span>
        </div>
      </div>

		   <div class="summary-box">

    <strong><span id="t7-sidebar-profile"></span></strong><br>
        <p><span id="t7-sidebar-wing"></span></p>
	        <p><span id="t7-sidebar-opening"></span></p>
	        <p>Breite: <span id="t7-sidebar-width"></span></p>
	        <p>Höhe: <span id="t7-sidebar-height"></span></p>
	        <div id="t7-sidebar-balkon-notes"></div>
	        <p>Beschlag: <span id="t7-sidebar-beschlag"></span></p>

        <p>Farbe Innen: <span id="t7-sidebar-innen"></span></p>
        <p>Farbe Außen: <span id="t7-sidebar-aussen"></span></p>
        <p>Griff: <span id="t7-sidebar-griff"></span></p>
	        <p>Isolierglas: <span id="t7-sidebar-isolierglas"></span></p>
	        <p>Ornament: <span id="t7-sidebar-ornament"></span></p>
	        <p>Dichtungen schwarz</p>
	        <p class="optional-summary-line" style="display:none;">VSG Glas: <span id="t7-sidebar-vsg"></span></p>

	        <p class="optional-summary-line" style="display:none;">Rahmen: <span id="t7-sidebar-rahmen"></span></p>
	        <p class="optional-summary-line" style="display:none;">Fensterbank-Anschlussprofil: <span id="t7-sidebar-fensterbank"></span></p>
        <span id="t7-sidebar-luefter" style="display:none"></span>
        <span id="t7-sidebar-reedkontakt" style="display:none"></span>
	        <div id="t7-sidebar-rollladen"></div>
	      </div>
      <button class="btnmain-cart cart preview-cart-button">🛒 Zum Warenkorb hinzufügen</button>
	    </div>
	     </div>
	  </div>
  <div class="bottom_check_point container">
<div class="progress-bar-container"><div class="progress-bar"></div></div>
      <div class="footer-buttons">
        <button class="btnmain back" onclick="prevTab()">ZURÜCK</button>
        <button class="btnmain next_butoon next" onclick="nextTab()">WEITER</button>
      </div>
	  </div>
</div>
</div>
</div>

<div id="globalBottomCheckpoint"></div>



</div>




</div></div>
</body>
</html>
