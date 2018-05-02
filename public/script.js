// This is called when the <input> file upload changes.
function submitCoverFormOnChange() {
  var input = document.getElementById('album-cover-image');
  var file = input.files[0];
  submitCoverForm(file);
}

// This starts the logo animation and sends an async
// request to the backend.
function submitCoverForm(file) {
  //document.getElementById('cover-form').submit();
  document.getElementById('cover-form').style.display = "none";
  document.getElementById('spinner').style.display = "block";

  var formData = new FormData();
  formData.append('file', file);
  formData.append('async', true);

  jQuery.ajax({
    url: 'player',
    data: formData,
    cache: false,
    contentType: false,
    processData: false,
    type: 'POST',
    success: function(data){
      if (!data.error) {
        window.location.replace('player?albumId=' + data.albumId + '&googleVisionGuess=' + data.googleVisionGuess);
      } else {
        window.location.replace('error');
      }
    }
  });
}

// This is code to make the drag and drop work
// Which I got from here:
// https://css-tricks.com/drag-and-drop-file-uploading/
// and is slightly modified.

var isAdvancedUpload = function() {
  var div = document.createElement('div');
  return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
}();

var $form = $('#cover-form');

if (isAdvancedUpload) {
  $form.addClass('has-advanced-upload');
  $('.box__button').hide();
  $('.box__file').hide();
}

if (isAdvancedUpload) {

  var droppedFiles = false;

  $form.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
  })
  .on('dragover dragenter', function() {
    $form.addClass('is-dragover');
  })
  .on('dragleave dragend drop', function() {
    $form.removeClass('is-dragover');
  })
  .on('drop', function(e) {
    droppedFiles = e.originalEvent.dataTransfer.files;
    console.log("DROP!");
    if (!droppedFiles[0]) {
      alert("Pleas drop a file, not an image");
    } else {
      submitCoverForm(droppedFiles[0]);
    }
  });
}