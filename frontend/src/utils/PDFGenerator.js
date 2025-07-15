import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Classe utilitaire pour générer des PDF à partir de contenu HTML
 */
class PDFGenerator {
  /**
   * Génère un PDF à partir d'un élément HTML
   * @param {HTMLElement} element - L'élément HTML à convertir en PDF
   * @param {string} filename - Le nom du fichier PDF à générer
   * @param {Object} options - Options de génération
   * @param {boolean} options.protege - Si le PDF doit être protégé par mot de passe
   * @param {string} options.motDePasse - Mot de passe pour protéger le PDF
   * @param {boolean} options.compresser - Si le PDF doit être compressé
   * @returns {Promise<Blob>} - Le blob du PDF généré
   */
  static async genererDepuisHTML(element, filename, options = {}) {
    try {
      // Capture l'élément HTML en canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Meilleure qualité
        useCORS: true, // Permet de charger des images cross-origin
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Dimensions du PDF (A4)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // Largeur A4 en mm
      const pageHeight = 297; // Hauteur A4 en mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Première page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Pages supplémentaires si nécessaire
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Protection du PDF si demandé
      if (options.protege && options.motDePasse) {
        pdf.setEncryption(options.motDePasse, options.motDePasse, {
          printing: 'highResolution',
          copying: false,
          modifying: false,
          annotating: false,
          fillingForms: false,
          contentAccessibility: true,
          documentAssembly: false
        });
      }
      
      // Compression du PDF si demandé
      if (options.compresser) {
        pdf.compress = true;
      }
      
      // Génération du PDF
      const pdfBlob = pdf.output('blob');
      
      return pdfBlob;
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw error;
    }
  }
  
  /**
   * Télécharge un PDF généré
   * @param {Blob} pdfBlob - Le blob du PDF à télécharger
   * @param {string} filename - Le nom du fichier PDF
   */
  static telechargerPDF(pdfBlob, filename) {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Envoie un PDF par email (simulation)
   * @param {Blob} pdfBlob - Le blob du PDF à envoyer
   * @param {string} email - L'adresse email du destinataire
   * @param {string} sujet - Le sujet de l'email
   * @param {string} message - Le message de l'email
   * @returns {Promise<boolean>} - True si l'envoi a réussi
   */
  static async envoyerParEmail(pdfBlob, email, sujet, message) {
    // Dans une application réelle, cette fonction enverrait le PDF à un backend
    // qui se chargerait d'envoyer l'email avec le PDF en pièce jointe
    
    // Simulation d'un appel API
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`PDF envoyé à ${email} avec le sujet "${sujet}"`);
        resolve(true);
      }, 1500);
    });
  }
  
  /**
   * Programme l'envoi automatique d'un rapport (simulation)
   * @param {number} clientId - ID du client
   * @param {string} typeRapport - Type de rapport
   * @param {string} frequence - Fréquence d'envoi (hebdomadaire, mensuel)
   * @param {Object} options - Options de génération et d'envoi
   * @returns {Promise<boolean>} - True si la programmation a réussi
   */
  static async programmerEnvoiAutomatique(clientId, typeRapport, frequence, options = {}) {
    // Dans une application réelle, cette fonction enregistrerait la programmation
    // dans une base de données pour un traitement ultérieur par un job scheduler
    
    // Simulation d'un appel API
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Envoi automatique programmé pour le client ${clientId}, rapport ${typeRapport}, fréquence ${frequence}`);
        resolve(true);
      }, 1000);
    });
  }
}

export default PDFGenerator;
