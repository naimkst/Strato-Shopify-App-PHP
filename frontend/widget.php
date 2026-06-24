<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Fenster Konfigurator</title>
  <link rel="stylesheet" href="https://droplify.de/deine-fenster24/frontend/style_now.css">
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
    display: block !important;
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


#tab6 a.inquiry-btn {
    background: #0B2D60;
    color: #fff;
    font-size: 22px;
    padding: 12px;
    margin-top: 20px;
    margin-bottom: 20px;
    font-weight: bold;
    width: 100%;
    display: block;
}

#tab6 .inquiry-box {
    margin-top: 20px;
    margin-bottom: 20px;
    text-align: center;
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


        <div style="margin-top:10px;">
<p></p>
          <strong><span id="sb-profile">IGLO 5 CLASSIC</span></strong><br>
          <span id="sb-wing">3-TLG. ELEMENT MIT 3 FELDER NEBENEINANDER</span><br>
          <span id="sb-opening">FESTVERGLASUNG</span><br>
          BREITE: <span id="sb-width">500</span> MM<br>
          HÖHE: <span id="sb-height">557</span> MM<br>
          BESCHLAG: <span id="sb-beschlag">SIEGENIA FAVORIT BASIS</span>
        </div>
        <div class="price-box">
<div class="price_inner">
          <strong>FENSTER  <span class="price" id="tab4-price">54.96 €</span></strong>
         
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
          <button class="btnmain-cart cart">🛒 ZUM WARENKORB HINZUFÜGEN</button>
        </div>
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
<p></p>
  <div style="margin-top:10px;text-align:left;">
    <strong><span id="glass-sidebar-profile">IGLO 5 CLASSIC</span></strong><br>
    <span id="glass-sidebar-wing">3-TLG. ELEMENT MIT 3 FELDER NEBENEINANDER</span><br>
    <span id="glass-sidebar-opening">FESTVERGLASUNG</span><br>
    BREITE: <span id="glass-sidebar-width">500</span> MM<br>
    HÖHE: <span id="glass-sidebar-height">557</span> MM<br>
    BESCHLAG: <span id="glass-sidebar-beschlag">SIEGENIA FAVORIT BASIS</span><br>
    FARBE INNEN: <span id="glass-sidebar-innen">BETONGRAU</span><br>
    FARBE AUSSEN: <span id="glass-sidebar-aussen">DUNKELROT</span><br>
    GRIFF: <span id="glass-sidebar-griff">FENSTERGRIFF GOLD</span><br>
    ISOLIERGLAS: <span id="glass-sidebar-isolierglas">3-FACH VERGLASUNG</span><br>
    ORNAMENT: <span id="glass-sidebar-ornament">KARO MATT</span><br>
	VSG Glas: <span id="glass-sidebar-vsg"></span>
  </div>
  <div class="price-box">
  <div class="price_inner">
    <strong>FENSTER <span class="price" id="glass-price">65.96 €</span></strong>
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
    <button class="btnmain-cart cart">🛒 ZUM WARENKORB HINZUFÜGEN</button>
  </div>
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
        <div class="tab active" onclick="switchAccessorySubTab('sprossen')">SPROSSEN</div>
        <div class="tab" onclick="switchAccessorySubTab('rahmenverbreiterung')">RAHMENVERBREITERUNG</div>
        <div class="tab" onclick="switchAccessorySubTab('fensterzubehoer')">FENSTERZUBEHÖR</div>
        <div class="tab" onclick="switchAccessorySubTab('rollladen')">ROLLLADEN</div>
      </div>
      <!-- Sprossen subtab -->
      <div id="sprossen-subtab" class="accessory-subtab" style="">
        <div class="section-title">SPROSSEN</div>
        <div class="option-grid">

          <div class="card-option active" onclick="selectSprosse(this,'18mm')">
            <img src="https://droplify.de/deine-fenster24/frontend/sixthtabSprossen.svg" alt="">
            <div>
              <strong>SPROSSEN 18 MM</strong>
              <span>Inneliegende Sprossen</span>
            </div>
            <span class="checkmark-box"><img src="https://droplify.de/deine-fenster24/frontend/Vector.svg"></span>
          </div>
          <div class="card-option" onclick="selectSprosse(this,'26mm')">
            <img src="https://droplify.de/deine-fenster24/frontend/sixthtabSprossen1.svg" alt="">
             <div>
              <strong>SPROSSEN 26 MM</strong>
             <span> Inneliegende Sprossen</span>
            </div>
            <span class="checkmark-box"><img src="https://droplify.de/deine-fenster24/frontend/Vector.svg"></span>
          </div>
        </div>
        <div class="formobilegroup" id="formobilegroup" style="display:flex;gap:2rem;margin-top:1rem;">
          <div class="form-group">
            <label for="sprosse-horizontal">HORIZONTAL (ELEMENTE)</label>
            <input type="number" id="sprosse-horizontal" value="2" min="0">
          </div>
          <div class="form-group">
            <label for="sprosse-vertikal">SENKRECHT (ELEMENTE)</label>
            <input type="number" id="sprosse-vertikal" value="2" min="0">
          </div>
        </div>
      </div>
      <!-- Rahmenverbreiterung subtab -->
      <div id="rahmenverbreiterung-subtab" class="accessory-subtab" style="display:none;">
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
      <!-- Fensterzubehör subtab -->
      <div id="fensterzubehoer-subtab" class="accessory-subtab" style="display:none;">
        <div class="section-title">FENSTERZUBEHÖR</div>
        <div style="display:flex;gap:2rem;">
          <div class="form-group">

            <label for="lz-luefter">LÜFTER</label>
            <select id="lz-luefter">
              <option>
         FENSTERFALZLUFTER CAIRE FLEX</option>
              <option>ANDERER LÜFTER</option>
            </select>
          </div>
          <div class="form-group">
            <label for="lz-reedkontakt">REEDKONTAKT</label>
            <select id="lz-reedkontakt">
              <option>REEDKONTAKT</option>
              <option>OHNE</option>
            </select>
          </div>
        </div>
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
     
      <p style="font-size:15px;">
        <strong><span id="zubehoer-sidebar-profile"></span></strong><br>
        <span id="zubehoer-sidebar-wing"></span><br>
        <span id="zubehoer-sidebar-opening"></span><br>
        BREITE: <span id="zubehoer-sidebar-width"></span> MM<br>
        HÖHE: <span id="zubehoer-sidebar-height"></span> MM<br>
        BESCHLAG: <span id="zubehoer-sidebar-beschlag"></span><br>
        FARBE INNEN: <span id="zubehoer-sidebar-innen"></span><br>
        FARBE AUSSEN: <span id="zubehoer-sidebar-aussen"></span><br>
        GRIFF: <span id="zubehoer-sidebar-griff"></span><br>
        ISOLIERGLAS: <span id="zubehoer-sidebar-isolierglas"></span><br>
        ORNAMENT: <span id="zubehoer-sidebar-ornament"></span><br>
        SPROSSEN: <span id="zubehoer-sidebar-sprosse"></span> 
        <!--H: <span id="zubehoer-sidebar-sprosseH"></span> |
        V: <span id="zubehoer-sidebar-sprosseV"></span><br>--->
       RAHMENVERBREITERUNG: <span id="zubehoer-sidebar-rahmen"></span><br>
        <!--LÜFTER: <span id="zubehoer-sidebar-luefter"></span><br>-->
        <!--REEDKONTAKT:<span id="zubehoer-sidebar-reedkontakt"></span>--->
       <span id="zubehoer-sidebar-rollladen"></span>

      </p>
      <div class="price-box">
      <div class="price_inner">
        <strong>FENSTER
        <span class="price" id="zubehoer-price">54.96 €</span></strong>
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
        <button class="btnmain-cart cart">🛒 ZUM WARENKORB HINZUFÜGEN</button>
      </div>
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
    </div>


    <!-- Right Sidebar (Preview Box reused layout) -->
    <div class="sidebar mypreviousdesign preview-box">
	<div class="forscrolling">
      <h4>Innenansicht</h4>
     <div id="tab7-svgPreviewBox"></div>
   <div class="summary-box">

    <strong><span id="t7-sidebar-profile"></span></strong><br>
        <p><span id="t7-sidebar-wing"></span></p>
        <p><span id="t7-sidebar-opening"></span></p>
        <p>Breite: <span id="t7-sidebar-width"></span></p>
        <p>Höhe: <span id="t7-sidebar-height"></span></p>
        <p>Beschlag: <span id="t7-sidebar-beschlag"></span></p>

        <p>Farbe Innen: <span id="t7-sidebar-innen"></span></p>
        <p>Farbe Außen: <span id="t7-sidebar-aussen"></span></p>
        <p>Griff: <span id="t7-sidebar-griff"></span></p>
        <p>Isolierglas: <span id="t7-sidebar-isolierglas"></span></p>
        <p>Ornament: <span id="t7-sidebar-ornament"></span></p>

        <p>Sprosse: <span id="t7-sidebar-sprosse"></span></p>
        <p>Rahmen: <span id="t7-sidebar-rahmen"></span></p>
        <p>Lüfter: <span id="t7-sidebar-luefter"></span></p>
        <p>Reedkontakt: <span id="t7-sidebar-reedkontakt"></span></p>
        <p>Rollladen:<span id="t7-sidebar-rollladen"></span></p>
      </div>


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

      <button class="btnmain-cart cart">🛒 Zum Warenkorb hinzufügen</button>
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
