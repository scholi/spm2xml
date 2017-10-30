# spm2xml
XML fileformat is used to save AFM data and can be easily read by Gwyddion. Unfortunately, Gwyddion cannot save this file format.
This small script allows you to incorporate the data of a .spm fileformat into an existing xml.

The application works only locally and your data are not transmitted to any server. This also means that you can use this application offline.

If you don't want to download it, you can test it here: https://scholi.github.io/spm2xml/

## Requirement
Modern web browser. Was tested with Chrome 61.0.3163.100.

The xml reading do not work with Internet Explorer!

## Documentation
How it works:
1. In the SPM file box, click "Choose file". Select the .spm file containing the data
2. In the XML file box, click "Choose file". Select the .xml file that you want to modify.
3. Select which direction you are interested in "forward"/"backward" with the first dropdown menu
4. Select which channel you are interested in with the second dropdown menu.
5. Click "Update channel of xml from spm". This will download automatically a nex xml file. If your xml is called filename.xml, the downloaded file will be called filename_edit.xml.
6. Enjoy
