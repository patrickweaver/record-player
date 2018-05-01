function submitCoverFormOnChange() {
  var input = document.getElementById('album-cover-image');
  var file = input.files[0];
  submitCoverForm(file);
}



function submitCoverForm(file) {
  //document.getElementById('cover-form').submit();
  document.getElementById('cover-form').style.display = "none";
  document.getElementById('spinner').style.display = "block";

  console.log(file);
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
        window.location.replace('player?albumId=' + data.albumId + '&googleVisionGuess=' + data.googleVisionGuess);
    }
  });
}


var isAdvancedUpload = function() {
  var div = document.createElement('div');
  return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
}();

var $form = $('#cover-form');

if (isAdvancedUpload) {
  $form.addClass('has-advanced-upload');
  $('#
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
    submitCoverForm(droppedFiles[0]);
  });
}