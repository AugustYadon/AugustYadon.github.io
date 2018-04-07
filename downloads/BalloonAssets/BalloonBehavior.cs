using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Valve.VR.InteractionSystem;

public class BalloonBehavior : MonoBehaviour {

    Vector3 world_start;
    public Transform balloon_front;
    public Transform balloon_back;
    Vector3 last_vel;
    Vector3 current_vel;
    Vector3 last_pos;
    Vector3 current_pos;
    
    [SerializeField] BalloonBarrel barrel_script;
    

    bool popped = false;
    bool thrown = false; 

    AudioSource popsound;
    public SkinnedMeshRenderer balloon_renderer;
    public GameObject pop;

    Animator anim;
    int smoothside_bool = 0;
    int knotside_bool = 1;
    int thrown_bool = 2;

    Rigidbody rb;
    float accel;
    float accel_factor = .001f;
    float accel_threshold = .06f;
    float jiggle_layer_weight = 0;
    Hand hand;

    // Use this for initialization
    void Start()
    {
        world_start = transform.position;
        rb = transform.GetComponent<Rigidbody>();
        anim = transform.GetComponent<Animator>();
        popsound = GetComponent<AudioSource>();
        current_pos = transform.position;
        last_pos = current_pos;
        last_vel = (current_pos - last_pos) * Time.deltaTime;
        current_vel = last_vel;
        smoothside_bool = Animator.StringToHash("smoothside");
        knotside_bool = Animator.StringToHash("knotside");
        thrown_bool = Animator.StringToHash("thrown");
    }

    void Update() {

        if (!popped && !thrown)
        {
            current_pos = transform.position;
            current_vel = (current_pos - last_pos) / Time.deltaTime;

            accel = (Vector3.Distance(last_vel, current_vel) * accel_factor) / Time.deltaTime;
            if (accel > accel_threshold) { jiggle_layer_weight = 0.7f; }
            jiggle_layer_weight = Mathf.Clamp(jiggle_layer_weight - (.8f * Time.deltaTime), 0, 0.7f);

            if (hand && jiggle_layer_weight > 0) { hand.controller.TriggerHapticPulse((ushort)((jiggle_layer_weight * 1000f))); }

            anim.SetLayerWeight(1, jiggle_layer_weight);
            last_pos = current_pos;
            last_vel = current_vel;

            if (this.transform.forward.y > 0.15f)
            {
                anim.SetBool(smoothside_bool, true);
                anim.SetBool(knotside_bool, false);
            }
            else if (this.transform.forward.y < -0.15f)
            {
                anim.SetBool(smoothside_bool, false);
                anim.SetBool(knotside_bool, true);
            }
            else
            {
                anim.SetBool(smoothside_bool, false);
                anim.SetBool(knotside_bool, false);
            }
        }
    }

    /// <summary>
    /// resets the balloon and puts it at a location
    /// </summary>
    public void SpawnBalloon()
    {
        popped = false;
        thrown = false; anim.SetBool(thrown_bool, false);
        balloon_renderer.enabled = true;
        pop.SetActive(false);
        if (Player.instance.leftHand.currentAttachedObject == this.gameObject) { hand = Player.instance.leftHand; }
        else if (Player.instance.rightHand.currentAttachedObject == this.gameObject) { hand = Player.instance.rightHand; }
    }

    public void Throw()
    {
        hand = null;
        thrown = true;
        rb.isKinematic = false;
        rb.angularVelocity = Random.insideUnitSphere * rb.velocity.sqrMagnitude/10f;
        anim.SetBool(thrown_bool, true);
        anim.SetBool(smoothside_bool, false);
        anim.SetBool(knotside_bool, false);
    }

    public void ManualPop()
    {
        if (!popped && thrown)
        {
            popped = true; thrown = false; anim.SetBool(thrown_bool, false);
            StartCoroutine(Pop(false));
        }
        else if (!popped && !thrown)
        {
            Throw();
            popped = true; thrown = false; anim.SetBool(thrown_bool, false);
            StartCoroutine(Pop(false));
        }
    }


    private void OnTriggerEnter(Collider col)
    {
        if (!popped && thrown)
        {
            popped = true; thrown = false; anim.SetBool(thrown_bool, false);
            StartCoroutine(Pop(true));
            RecieveDamage rd = col.GetComponent<RecieveDamage>();
            if (rd) { rd.Damage(); }
        }

    }

    IEnumerator Pop(bool go_to_barrel)
    {
        pop.SetActive(true);
        popsound.Play();
        yield return null;

        rb.isKinematic = true;
        rb.velocity = Vector3.zero;
        rb.angularVelocity = Vector3.zero;
        balloon_renderer.enabled = false;

        yield return new WaitForSeconds(1f);

        if (go_to_barrel) { this.transform.position = barrel_script.balloon_slot.transform.position; }
        else { this.transform.position = world_start; }
    }

}
